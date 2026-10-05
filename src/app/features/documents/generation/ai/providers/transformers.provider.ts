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

  private extractJobDescription(prompt: string): string {
    const match = prompt.match(/<job_description>\n?([\s\S]*?)\n?<\/job_description>/);
    return (match?.[1] ?? prompt).trim();
  }
}
