import { inject, Service } from '@angular/core';
import { JobAnalysis } from '../../../jobs/models/job-analysis';
import { AiUsageRepository } from '../../data/ai-usage.repository';
import {
  AiGenerationRequest,
  AiGenerationResult,
  AiGenerativeCapability,
  AiProvider,
  AiRequestContext,
} from './ai-provider';
import { FirebaseGeminiProvider } from './providers/firebase-gemini.provider';
import { TransformersProvider } from './providers/transformers.provider';
import { WebLlmProvider } from './providers/webllm.provider';
import {
  GenerateCoverLetterRequest,
  GenerateCoverLetterResult,
  GenerateCvRequest,
  GenerateCvResult,
} from './ai-tasks';
import { AiRun } from './tasks/ai-task';
import { analyseJobTask } from './tasks/job-analysis.task';
import { pickSelectedFacts, selectEvidenceTask } from './tasks/evidence-selection.task';
import { generateCvTask } from './tasks/cv-generation.task';
import { generateCoverLetterTask } from './tasks/cover-letter-generation.task';
import { SemanticSimilarityService } from './local/semantic-similarity';
import { AiTelemetry } from './local/ai-telemetry';
import { AuthService } from '../../../../core/auth/auth.service';
import { Career } from '../../../profile/models/career';
import { validateCv } from './cv-validator';
import { GeneratedCv } from '../../models/generated-cv';
import { validateCoverLetter } from './cover-letter-validator';
import { GeneratedCoverLetter } from '../../models/generated-cover-letter';

type EvidenceInput = Pick<
  GenerateCvRequest,
  'job' | 'career' | 'profile' | 'analysis' | 'onProgress'
>;

@Service()
export class AiService {
  private auth = inject(AuthService);
  private transformers = inject(TransformersProvider);
  private webllm = inject(WebLlmProvider);
  private gemini = inject(FirebaseGeminiProvider);
  private similarity = inject(SemanticSimilarityService);
  private telemetry = inject(AiTelemetry);
  private usage = inject(AiUsageRepository);

  private static readonly LOCAL_LATENCY_BUDGET_MS = 45_000;

  private async runInternal<T>(
    request: AiGenerationRequest,
    isAcceptable: (capability: AiGenerativeCapability, data: unknown) => boolean,
  ): Promise<AiGenerationResult<T>> {
    if (!this.auth.isEmailVerified()) {
      throw new Error('Verify your email to use AI features.');
    }

    const chain = this.providerChain(request.capability, request.context);

    if (!chain.length) {
      // Phase 13's whole point: local-only must fail loudly, never silently
      // reach for Gemini because "no provider happened to be available".
      const reason =
        request.context?.privacyMode === 'local-only' ||
        request.context?.allowCloudFallback === false
          ? `No local AI provider is available for ${request.capability}, and cloud fallback is disabled.`
          : `No AI provider supports ${request.capability}.`;
      throw new Error(reason);
    }

    let lastError: unknown;
    let attemptIndex = 0;

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      const isLastResort = i === chain.length - 1;

      if (!(await provider.isAvailable())) continue;

      const isFallback = attemptIndex > 0;
      attemptIndex++;

      try {
        if (provider.execution === 'cloud') {
          await this.usage.checkAndRecord();
        }
        const result = await provider.generate<T>(request);
        const withinLatencyBudget =
          provider.execution !== 'local' || result.latencyMs <= AiService.LOCAL_LATENCY_BUDGET_MS;
        const accepted =
          isLastResort || (withinLatencyBudget && isAcceptable(request.capability, result.data));

        this.telemetry.record({
          provider: provider.id,
          execution: provider.execution,
          task: request.capability,
          success: accepted,
          fallback: isFallback,
        });

        if (accepted) return result;
        if (!withinLatencyBudget) {
          console.warn(
            `[ai:${provider.id}:${request.capability}] took ${result.latencyMs}ms, over the ${AiService.LOCAL_LATENCY_BUDGET_MS}ms local budget. Falling back...`,
          );
        }
      } catch (error) {
        console.error(`[ai:${provider.id}:${request.capability}] provider failed`, error);
        this.telemetry.record({
          provider: provider.id,
          execution: provider.execution,
          task: request.capability,
          success: false,
          fallback: isFallback,
        });
        lastError = error;
      }
    }

    throw lastError ?? new Error('No AI provider was able to complete this request.');
  }

  private run: AiRun = <T>(request: AiGenerationRequest) =>
    this.runInternal<T>(request, (capability, data) => this.isAcceptable(capability, data));

  private providerChain(
    capability: AiGenerativeCapability,
    context?: AiRequestContext,
  ): AiProvider[] {
    const cloudAllowed =
      !context || (context.allowCloudFallback && context.privacyMode !== 'local-only');

    let chain = [this.transformers, this.webllm, this.gemini].filter(
      (provider) =>
        provider.capabilities.includes(capability) &&
        (cloudAllowed || provider.execution === 'local'),
    );

    if (context?.preferredProvider) {
      const preferred = chain.find((provider) => provider.id === context.preferredProvider);
      if (preferred) {
        chain = [preferred, ...chain.filter((provider) => provider !== preferred)];
      }
    }

    return chain;
  }

  private isAcceptable(capability: AiGenerativeCapability, data: unknown): boolean {
    if (capability !== 'job-analysis') return true;

    const analysis = data as Partial<JobAnalysis>;
    return (
      (analysis.requiredSkills?.length ?? 0) +
        (analysis.preferredSkills?.length ?? 0) +
        (analysis.technologies?.length ?? 0) +
        (analysis.domains?.length ?? 0) >
      0
    );
  }

  async describeProcessing(
    capabilities: AiGenerativeCapability[],
  ): Promise<{ local: boolean; cloud: boolean }> {
    const hasLocal = await Promise.all(
      capabilities.map((capability) => this.hasAvailableLocalProvider(capability)),
    );

    return {
      local: hasLocal.some(Boolean),
      cloud: hasLocal.some((available) => !available),
    };
  }

  private async hasAvailableLocalProvider(capability: AiGenerativeCapability): Promise<boolean> {
    const localCandidates = this.providerChain(capability).filter(
      (provider) => provider.execution === 'local',
    );

    for (const provider of localCandidates) {
      if (await provider.isAvailable()) return true;
    }
    return false;
  }

  private inFlight = new Map<string, Promise<unknown>>();

  private dedupe<T>(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = factory().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, promise);
    return promise;
  }

  private requestKey(prefix: string, request: object): string {
    const { onProgress: _onProgress, ...rest } = request as Record<string, unknown>;
    return `${prefix}:${JSON.stringify(rest)}`;
  }

  private runWithContext(context?: AiRequestContext): AiRun {
    if (!context) return this.run;
    return <T>(request: AiGenerationRequest) => this.run<T>({ ...request, context });
  }

  private runWithAcceptance(
    context: AiRequestContext | undefined,
    isAcceptable: (capability: AiGenerativeCapability, data: unknown) => boolean,
  ): AiRun {
    return <T>(request: AiGenerationRequest) =>
      this.runInternal<T>(context ? { ...request, context } : request, isAcceptable);
  }

  private cvAcceptance(
    career: Career,
  ): (capability: AiGenerativeCapability, data: unknown) => boolean {
    return (capability, data) => {
      if (capability !== 'cv-generation') return this.isAcceptable(capability, data);
      return validateCv(data as GeneratedCv, career).ok;
    };
  }

  private coverLetterAcceptance(
    career: Career,
  ): (capability: AiGenerativeCapability, data: unknown) => boolean {
    return (capability, data) => {
      if (capability !== 'cover-letter-generation') return this.isAcceptable(capability, data);
      return validateCoverLetter(data as GeneratedCoverLetter, career).ok;
    };
  }

  async analyseJob(jobDescription: string, context?: AiRequestContext): Promise<JobAnalysis> {
    const key = `job-analysis:${jobDescription.trim()}:${JSON.stringify(context ?? {})}`;
    return this.dedupe(key, () => analyseJobTask(this.runWithContext(context), jobDescription));
  }

  async generateCv(request: GenerateCvRequest): Promise<GenerateCvResult> {
    const key = this.requestKey('cv-generation', request);
    return this.dedupe(key, () => this.runGenerateCv(request));
  }

  private async runGenerateCv(request: GenerateCvRequest): Promise<GenerateCvResult> {
    const run = this.runWithAcceptance(request.context, this.cvAcceptance(request.career));
    const { analysis, selection, selectedFacts } = await this.prepareEvidence(request, run);

    request.onProgress?.('writing');
    const { cv, model } = await generateCvTask(run, {
      info: request.info,
      career: request.career,
      profile: request.profile,
      analysis,
      selectedFacts,
      options: request.options,
    });

    return { cv, analysis, selection, model };
  }

  async generateCoverLetter(
    request: GenerateCoverLetterRequest,
  ): Promise<GenerateCoverLetterResult> {
    const key = this.requestKey('cover-letter-generation', request);
    return this.dedupe(key, () => this.runGenerateCoverLetter(request));
  }

  private async runGenerateCoverLetter(
    request: GenerateCoverLetterRequest,
  ): Promise<GenerateCoverLetterResult> {
    const run = this.runWithAcceptance(request.context, this.coverLetterAcceptance(request.career));
    const { analysis, selection, selectedFacts } = await this.prepareEvidence(request, run);

    request.onProgress?.('writing');
    const { letter, model } = await generateCoverLetterTask(run, {
      info: request.info,
      career: request.career,
      job: request.job,
      profile: request.profile,
      analysis,
      selectedFacts,
      cv: request.cv,
      options: request.options,
    });

    return { letter, analysis, selection, model };
  }

  private async prepareEvidence(request: EvidenceInput, run: AiRun) {
    let analysis = request.analysis;
    if (!analysis) {
      request.onProgress?.('analysing');
      analysis = await analyseJobTask(run, request.job.jobDescription);
    }

    request.onProgress?.('selecting');
    const { selection, facts } = await selectEvidenceTask(
      run,
      analysis,
      request.career,
      request.profile,
      this.similarity,
    );

    return { analysis, selection, selectedFacts: pickSelectedFacts(facts, selection) };
  }
}
