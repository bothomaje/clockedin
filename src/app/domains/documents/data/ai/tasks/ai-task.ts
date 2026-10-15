import { AiGenerationRequest, AiGenerationResult } from '../ai-provider';

export type AiRun = <T>(request: AiGenerationRequest) => Promise<AiGenerationResult<T>>;
