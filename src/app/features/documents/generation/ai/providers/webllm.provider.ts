import { Service, inject } from '@angular/core';
import {
  AiErrorKind,
  AiGenerationRequest,
  AiGenerationResult,
  AiGenerativeCapability,
  AiProvider,
  AiProviderError,
} from '../ai-provider';
import { toJsonSchema } from '../schemas/to-json-schema';
import { WebLlmEngine } from '../local/webllm-engine';

const MODEL_LABEL = 'webllm/Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const DEFAULT_TEMPERATURE = 0.2;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const CONTEXT_BUDGET_TOKENS = 8192 - 1024;
const CHARS_PER_TOKEN_ESTIMATE = 4;

@Service()
export class WebLlmProvider implements AiProvider {
  readonly id = 'webllm' as const;
  readonly execution = 'local' as const;
  readonly capabilities: readonly AiGenerativeCapability[] = [
    'job-analysis',
    'cv-generation',
    'cover-letter-generation',
  ];

  private engine = inject(WebLlmEngine);

  async isAvailable(): Promise<boolean> {
    return this.engine.isAvailable();
  }

  async generate<T>(request: AiGenerationRequest): Promise<AiGenerationResult<T>> {
    if (!this.capabilities.includes(request.capability)) {
      throw new AiProviderError(
        'unavailable',
        this.id,
        `Provider ${this.id} does not support ${request.capability}.`,
      );
    }

    const estimatedTokens = this.estimateTokens(request.systemInstruction + request.prompt);
    if (estimatedTokens > CONTEXT_BUDGET_TOKENS) {
      console.warn(
        `[ai:webllm:${request.capability}] prompt too large for local context window ` +
          `(~${estimatedTokens} est. tokens, budget ${CONTEXT_BUDGET_TOKENS}) — skipping to next provider`,
      );
      throw new AiProviderError(
        'unavailable',
        this.id,
        `Prompt too large for the local model's context window (~${estimatedTokens} estimated tokens).`,
      );
    }

    const startedAt = performance.now();
    const jsonSchema = toJsonSchema(request.schema);
    let delay = RETRY_DELAY_MS;

    for (let attempt = 1; ; attempt++) {
      try {
        const raw = await this.engine.chat(
          request.systemInstruction,
          request.prompt,
          jsonSchema,
          request.temperature ?? DEFAULT_TEMPERATURE,
        );

        const data = JSON.parse(raw) as T;

        return {
          data,
          providerId: this.id,
          model: MODEL_LABEL,
          latencyMs: Math.round(performance.now() - startedAt),
          attempts: attempt,
        };
      } catch (error) {
        console.error(`[ai:webllm:${request.capability}] attempt ${attempt} failed`, error);

        if (attempt < MAX_ATTEMPTS && this.isTransient(error)) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw this.toProviderError(error);
      }
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
  }

  private isTransient(error: unknown): boolean {
    if (error instanceof SyntaxError) return true;

    const message = String((error as { message?: string })?.message ?? '').toLowerCase();
    return message.includes('device lost') || message.includes('out of memory');
  }

  private toProviderError(error: unknown): AiProviderError {
    const fail = (kind: AiErrorKind, message: string) =>
      new AiProviderError(kind, this.id, message, { cause: error });

    if (error instanceof SyntaxError) {
      return fail('invalid-output', 'The local model returned an unreadable response.');
    }

    const message = String((error as { message?: string })?.message ?? '').toLowerCase();

    if (message.includes('context window') || message.includes('prompt tokens exceed')) {
      return fail('unavailable', "Prompt exceeded the local model's context window.");
    }

    if (message.includes('webgpu') || message.includes('gpu')) {
      return fail('unavailable', 'WebGPU is unavailable or the local model failed to load.');
    }

    return fail(
      this.isTransient(error) ? 'transient' : 'unknown',
      'The local model failed to generate a response.',
    );
  }
}
