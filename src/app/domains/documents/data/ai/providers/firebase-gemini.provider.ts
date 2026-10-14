import { Service } from '@angular/core';
import { GenerativeModel, getGenerativeModel, Schema } from 'firebase/ai';
import { firebaseAi } from '../../../../../core/firebase/firebase';
import {
  AiErrorKind,
  AiGenerationRequest,
  AiGenerationResult,
  AiGenerativeCapability,
  AiJsonSchema,
  AiProvider,
  AiProviderError,
} from '../ai-provider';

const MODEL_NAME = 'gemini-3.5-flash-lite';
const DEFAULT_TEMPERATURE = 0.2;
const MAX_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

@Service()
export class FirebaseGeminiProvider implements AiProvider {
  readonly id = 'firebase-gemini' as const;
  readonly execution = 'cloud' as const;
  readonly capabilities: readonly AiGenerativeCapability[] = [
    'job-analysis',
    'evidence-selection',
    'cv-generation',
    'cover-letter-generation',
  ];

  private models = new Map<AiGenerativeCapability, GenerativeModel>();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate<T>(request: AiGenerationRequest): Promise<AiGenerationResult<T>> {
    if (!this.capabilities.includes(request.capability)) {
      throw new AiProviderError(
        'unavailable',
        this.id,
        `Provider ${this.id} does not support ${request.capability}.`,
      );
    }

    const model = this.modelFor(request);
    const startedAt = performance.now();
    let delay = INITIAL_RETRY_DELAY_MS;

    for (let attempt = 1; ; attempt++) {
      try {
        const result = await model.generateContent(request.prompt);
        const data = JSON.parse(result.response.text()) as T;

        return {
          data,
          providerId: this.id,
          model: MODEL_NAME,
          latencyMs: Math.round(performance.now() - startedAt),
          attempts: attempt,
        };
      } catch (error) {
        console.error(`[ai:${request.capability}] attempt ${attempt} failed`, {
          promptChars: request.prompt.length,
          code: (error as { code?: string })?.code,
          message: (error as { message?: string })?.message,
          error,
        });

        if (attempt < MAX_ATTEMPTS && this.isTransient(error)) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        throw this.toProviderError(error);
      }
    }
  }

  private modelFor(request: AiGenerationRequest): GenerativeModel {
    const cached = this.models.get(request.capability);
    if (cached) return cached;

    const model = getGenerativeModel(firebaseAi, {
      model: MODEL_NAME,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: this.toFirebaseSchema(request.schema),
        temperature: request.temperature ?? DEFAULT_TEMPERATURE,
      },
      systemInstruction: request.systemInstruction,
    });

    this.models.set(request.capability, model);
    return model;
  }

  private toFirebaseSchema(schema: AiJsonSchema): Schema {
    switch (schema.type) {
      case 'string':
        return Schema.string();
      case 'array':
        return Schema.array({ items: this.toFirebaseSchema(schema.items) });
      case 'object':
        return Schema.object({
          properties: Object.fromEntries(
            Object.entries(schema.properties).map(([key, value]) => [
              key,
              this.toFirebaseSchema(value),
            ]),
          ),
          optionalProperties: Object.keys(schema.properties).filter(
            (key) => !schema.required.includes(key),
          ),
        });
    }
  }

  private isTransient(err: unknown): boolean {
    const message = String((err as { message?: string })?.message ?? '').toLowerCase();

    return (
      message.includes('ai/fetch-error') ||
      message.includes('overloaded') ||
      message.includes('unavailable') ||
      message.includes('500') ||
      message.includes('503')
    );
  }

  private toProviderError(err: unknown): AiProviderError {
    const fail = (kind: AiErrorKind, message: string) =>
      new AiProviderError(kind, this.id, message, { cause: err });

    if (err instanceof SyntaxError) {
      return fail('invalid-output', 'The model returned an unreadable response. Please try again.');
    }

    const aiError = err as { code?: string; message?: string };
    const code = aiError?.code?.toLowerCase() ?? '';
    const message = aiError?.message?.toLowerCase() ?? '';

    if (
      message.includes('429') ||
      message.includes('quota') ||
      message.includes('resource-exhausted')
    ) {
      return fail('quota', 'AI usage quota reached. Please try again later.');
    }

    if (message.includes('401') || code.includes('unauthenticated')) {
      return fail(
        'unauthenticated',
        'Firebase AI Logic rejected this request (401). Check that the Firebase AI Logic API is enabled for the project and that the Firebase web API key is allowed to use it.',
      );
    }

    return fail(
      this.isTransient(err) ? 'transient' : 'unknown',
      'Could not complete the AI request right now. Please try again.',
    );
  }
}
