import { Service, inject } from '@angular/core';
import { JobAnalysis } from '../../../../jobs/models/job-analysis';
import {
  AiGenerationRequest,
  AiGenerationResult,
  AiGenerativeCapability,
  AiProvider,
  AiProviderError,
} from '../ai-provider';
import { EmbeddingModel } from '../local/embedding-model';
import { KeywordExtractor } from '../local/keyword-extraction';

const MODEL_LABEL = 'transformers-js/all-MiniLM-L6-v2';

/**
 * Local, non-generative job-analysis provider (roadmap Phase 4).
 *
 * Extracts keywords already present in the job description — nothing invented,
 * so it needs none of Gemini's factual guardrails. It does NOT attempt
 * requiredSkills / preferredSkills / technologies / domains / seniority /
 * responsibilities: those need judgement about what's required vs implied,
 * which is classification/reasoning, not extraction. Those fields come back
 * empty; the caller decides whether that's good enough or needs Gemini.
 *
 * Not wired into AiService yet — that's the Phase 6/7 orchestrator's job.
 */
@Service()
export class TransformersProvider implements AiProvider {
  readonly id = 'transformers' as const;
  readonly execution = 'local' as const;
  readonly capabilities: readonly AiGenerativeCapability[] = ['job-analysis'];

  private embeddingModel = inject(EmbeddingModel);
  private keywords = inject(KeywordExtractor);

  async isAvailable(): Promise<boolean> {
    return this.embeddingModel.isAvailable();
  }

  async generate<T>(request: AiGenerationRequest): Promise<AiGenerationResult<T>> {
    if (request.capability !== 'job-analysis') {
      throw new AiProviderError(
        'unavailable',
        this.id,
        `Provider ${this.id} does not support ${request.capability}.`,
      );
    }

    const startedAt = performance.now();
    const description = this.extractJobDescription(request.prompt);

    try {
      const keywords = await this.keywords.extract(description);

      const data: JobAnalysis = {
        requiredSkills: [],
        preferredSkills: [],
        responsibilities: [],
        technologies: [],
        domains: [],
        seniority: '',
        keywords,
      };

      return {
        data: data as unknown as T,
        providerId: this.id,
        model: MODEL_LABEL,
        latencyMs: Math.round(performance.now() - startedAt),
        attempts: 1,
      };
    } catch (error) {
      throw new AiProviderError('unknown', this.id, 'Local keyword extraction failed.', {
        cause: error,
      });
    }
  }

  /**
   * job-analysis.task.ts wraps the description in <job_description> tags.
   * This is a leaky coupling to that prompt convention — flagged for the
   * Phase 6/7 orchestrator, which should carry structured input alongside
   * the prompt so local providers don't need to parse it back out.
   */
  private extractJobDescription(prompt: string): string {
    const match = prompt.match(/<job_description>\n?([\s\S]*?)\n?<\/job_description>/);
    return (match?.[1] ?? prompt).trim();
  }
}
