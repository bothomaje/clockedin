import { Service, computed, inject, Signal } from '@angular/core';
import { EmbeddingModel, ModelStatus } from './embedding-model';
import { WebLlmEngine } from './webllm-engine';

export type AiEngineId = 'transformers' | 'webllm';

export interface AiEngineStatus {
  id: AiEngineId;
  label: string;
  status: ModelStatus;
  progress: number;
  generating: boolean;
}

@Service()
export class AiModelStatusService {
  private embeddingModel = inject(EmbeddingModel);
  private webLlmEngine = inject(WebLlmEngine);

  readonly engines: Signal<AiEngineStatus[]> = computed(() => [
    {
      id: 'transformers',
      label: 'On-device keyword matching',
      status: this.embeddingModel.status(),
      progress: this.embeddingModel.progress(),
      generating: this.embeddingModel.generating(),
    },
    {
      id: 'webllm',
      label: 'On-device CV/cover-letter model',
      status: this.webLlmEngine.status(),
      progress: this.webLlmEngine.progress(),
      generating: this.webLlmEngine.generating(),
    },
  ]);

  readonly busy: Signal<boolean> = computed(() =>
    this.engines().some(
      (engine) =>
        engine.status === 'checking' ||
        engine.status === 'downloading' ||
        engine.status === 'loading',
    ),
  );

  preload(id: AiEngineId): void {
    if (id === 'transformers') {
      void this.embeddingModel.load().catch(() => undefined);
    } else {
      void this.webLlmEngine.load().catch(() => undefined);
    }
  }

  async unload(id: AiEngineId): Promise<void> {
    if (id === 'transformers') {
      await this.embeddingModel.unload();
    } else {
      await this.webLlmEngine.unload();
    }
  }
}
