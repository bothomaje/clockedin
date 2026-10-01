import { AiGenerationRequest, AiGenerationResult } from '../ai-provider';

/** Runs one structured generation. Tasks depend on this, never on a concrete provider. */
export type AiRun = <T>(request: AiGenerationRequest) => Promise<AiGenerationResult<T>>;
