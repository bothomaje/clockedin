export type AiProviderId = 'firebase-gemini' | 'webllm' | 'chrome-ai' | 'transformers';

export type AiCapability =
  | 'job-analysis'
  | 'evidence-selection'
  | 'semantic-matching'
  | 'text-rewrite'
  | 'cv-generation'
  | 'cover-letter-generation';

export type AiGenerativeCapability = Exclude<AiCapability, 'semantic-matching'>;

export type AiExecution = 'cloud' | 'local';

export type AiJsonSchema =
  | { type: 'string' }
  | { type: 'array'; items: AiJsonSchema }
  | { type: 'object'; properties: Record<string, AiJsonSchema>; required: string[] };

export interface AiRequestContext {
  task: AiGenerativeCapability;
  preferredProvider?: AiProviderId;
  allowCloudFallback: boolean;
  privacyMode: 'local-only' | 'hybrid';
  model?: string;
}

export interface AiGenerationRequest {
  capability: AiGenerativeCapability;
  systemInstruction: string;
  prompt: string;
  schema: AiJsonSchema;
  temperature?: number;
  context?: AiRequestContext;
}

export interface AiGenerationResult<T> {
  data: T;
  providerId: AiProviderId;
  model: string;
  latencyMs: number;
  attempts: number;
}

export interface AiProvider {
  readonly id: AiProviderId;
  readonly execution: AiExecution;
  readonly capabilities: readonly AiGenerativeCapability[];

  isAvailable(): Promise<boolean>;

  generate<T>(request: AiGenerationRequest): Promise<AiGenerationResult<T>>;
}

export type AiErrorKind =
  'quota' | 'unauthenticated' | 'transient' | 'invalid-output' | 'unavailable' | 'unknown';

export class AiProviderError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    readonly providerId: AiProviderId,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = 'AiProviderError';
  }
}
