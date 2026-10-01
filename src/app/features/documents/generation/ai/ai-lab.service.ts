import { inject, Service } from '@angular/core';
import { Career } from '../../../profile/models/career';
import { CvValidationResult } from '../../models/cv-validation';
import {
  AiGenerationRequest,
  AiGenerativeCapability,
  AiProvider,
  AiProviderId,
} from './ai-provider';
import { AiRun } from './tasks/ai-task';
import { analyseJobTask } from './tasks/job-analysis.task';
import { generateCvTask } from './tasks/cv-generation.task';
import { generateCoverLetterTask } from './tasks/cover-letter-generation.task';
import { pickSelectedFacts, selectEvidenceTask } from './tasks/evidence-selection.task';
import { GenerateCoverLetterRequest, GenerateCvRequest } from './ai-tasks';
import { FirebaseGeminiProvider } from './providers/firebase-gemini.provider';
import { TransformersProvider } from './providers/transformers.provider';
import { WebLlmProvider } from './providers/webllm.provider';
import { SemanticSimilarityService } from './local/semantic-similarity';
import { AiService } from './ai.service';
import { validateCv } from './cv-validator';
import { validateCoverLetter } from './cover-letter-validator';

export interface AiLabRunResult {
  providerId: AiProviderId;
  execution: 'local' | 'cloud';
  model: string;
  success: boolean;
  latencyMs: number;
  attempts?: number;
  data?: unknown;
  /** Structural/factual check via the existing validators — only set for cv/cover-letter comparisons. */
  validation?: CvValidationResult;
  error?: string;
}

/** Marker used internally to pull a task's built AiGenerationRequest out without letting it actually call a provider. */
class CapturedRequestSignal {
  constructor(readonly request: AiGenerationRequest) {}
}

/**
 * Development-only AI evaluation harness (roadmap Phase 16). Runs the same
 * request through several providers and reports latency/success/validity
 * side by side — no /ai-lab route or UI built here, that's separate from
 * this project's current dev-plan work. This service is what a future
 * /ai-lab page would call.
 *
 * WARNING: this deliberately bypasses AiService's quota and dedup logic for
 * the providers being compared — that's the point (you want every provider
 * to actually run, not have one skipped by dedup or a quota short-circuit).
 * Comparing against 'firebase-gemini' spends real Spark quota, once per
 * provider in the comparison, every time you run a comparison.
 */
@Service()
export class AiLabService {
  private transformers = inject(TransformersProvider);
  private webllm = inject(WebLlmProvider);
  private gemini = inject(FirebaseGeminiProvider);
  private similarity = inject(SemanticSimilarityService);
  private ai = inject(AiService);

  private readonly geminiRun: AiRun = <T>(request: AiGenerationRequest) =>
    this.gemini.generate<T>(request);

  async compareJobAnalysis(
    jobDescription: string,
    providerIds: AiProviderId[],
  ): Promise<AiLabRunResult[]> {
    const request = await this.captureRequest((run) => analyseJobTask(run, jobDescription));
    return this.runAcrossProviders(request, providerIds);
  }

  async compareCvGeneration(
    request: Omit<GenerateCvRequest, 'context'>,
    providerIds: AiProviderId[],
  ): Promise<AiLabRunResult[]> {
    const { analysis, selectedFacts } = await this.prepareEvidence(request);

    const built = await this.captureRequest((run) =>
      generateCvTask(run, {
        info: request.info,
        career: request.career,
        profile: request.profile,
        analysis,
        selectedFacts,
        options: request.options,
      }),
    );

    const results = await this.runAcrossProviders(built, providerIds);
    return this.attachCvValidation(results, request.career);
  }

  async compareCoverLetterGeneration(
    request: Omit<GenerateCoverLetterRequest, 'context'>,
    providerIds: AiProviderId[],
  ): Promise<AiLabRunResult[]> {
    const { analysis, selectedFacts } = await this.prepareEvidence(request);

    const built = await this.captureRequest((run) =>
      generateCoverLetterTask(run, {
        info: request.info,
        career: request.career,
        job: request.job,
        profile: request.profile,
        analysis,
        selectedFacts,
        cv: request.cv,
        options: request.options,
      }),
    );

    const results = await this.runAcrossProviders(built, providerIds);
    return this.attachCoverLetterValidation(results, request.career);
  }

  private async prepareEvidence(
    request: Pick<GenerateCvRequest, 'job' | 'career' | 'profile' | 'analysis'>,
  ) {
    const analysis = request.analysis ?? (await this.ai.analyseJob(request.job.jobDescription));

    const { selection, facts } = await selectEvidenceTask(
      this.geminiRun,
      analysis,
      request.career,
      request.profile,
      this.similarity,
    );

    return { analysis, selectedFacts: pickSelectedFacts(facts, selection) };
  }

  /** Aborts the task the moment it calls the provider, capturing the exact request it built. */
  private async captureRequest<T>(
    invoke: (run: AiRun) => Promise<T>,
  ): Promise<AiGenerationRequest> {
    const capturingRun: AiRun = async <U>(request: AiGenerationRequest) => {
      throw new CapturedRequestSignal(request);
      // Body only ever throws — the AiGenerationResult<U> return type is
      // never actually produced, which is fine: a function typed to return
      // X can satisfy that by always throwing instead.
    };

    try {
      await invoke(capturingRun);
    } catch (error) {
      if (error instanceof CapturedRequestSignal) return error.request;
      throw error; // a genuine error from building the request (e.g. empty job description) — surface it
    }

    throw new Error('Task completed without calling the AI provider — nothing to compare.');
  }

  private async runAcrossProviders(
    request: AiGenerationRequest,
    providerIds: AiProviderId[],
  ): Promise<AiLabRunResult[]> {
    return Promise.all(providerIds.map((id) => this.runOne(request, id)));
  }

  private async runOne(request: AiGenerationRequest, id: AiProviderId): Promise<AiLabRunResult> {
    const provider = this.providerById(id);
    const startedAt = performance.now();

    try {
      if (!(await provider.isAvailable())) {
        return {
          providerId: id,
          execution: provider.execution,
          model: '(unavailable)',
          success: false,
          latencyMs: 0,
          error: 'Provider reported unavailable in this browser/session.',
        };
      }

      const result = await provider.generate(request);

      return {
        providerId: id,
        execution: provider.execution,
        model: result.model,
        success: true,
        latencyMs: result.latencyMs,
        attempts: result.attempts,
        data: result.data,
      };
    } catch (error) {
      return {
        providerId: id,
        execution: provider.execution,
        model: '(failed)',
        success: false,
        latencyMs: Math.round(performance.now() - startedAt),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private attachCvValidation(results: AiLabRunResult[], career: Career): AiLabRunResult[] {
    return results.map((result) =>
      result.success
        ? {
            ...result,
            validation: validateCv(result.data as Parameters<typeof validateCv>[0], career),
          }
        : result,
    );
  }

  private attachCoverLetterValidation(results: AiLabRunResult[], career: Career): AiLabRunResult[] {
    return results.map((result) =>
      result.success
        ? {
            ...result,
            validation: validateCoverLetter(
              result.data as Parameters<typeof validateCoverLetter>[0],
              career,
            ),
          }
        : result,
    );
  }

  private providerById(id: AiProviderId): AiProvider {
    switch (id) {
      case 'transformers':
        return this.transformers;
      case 'webllm':
        return this.webllm;
      case 'firebase-gemini':
        return this.gemini;
      default:
        throw new Error(`AI Lab does not have a provider wired up for "${id}" yet.`);
    }
  }
}
