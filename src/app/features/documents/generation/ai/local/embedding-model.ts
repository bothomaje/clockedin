import { Service, signal } from '@angular/core';

export type ModelStatus =
  'unavailable' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error';

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

type FeatureExtractionPipeline = (
  texts: string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

@Service()
export class EmbeddingModel {
  readonly status = signal<ModelStatus>('unavailable');
  readonly progress = signal(0);
  readonly generating = signal(false);

  private extractorPromise?: Promise<FeatureExtractionPipeline>;

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];
    const extractor = await this.loadExtractor();
    this.generating.set(true);
    try {
      const output = await extractor(texts, { pooling: 'mean', normalize: true });
      return output.tolist();
    } finally {
      this.generating.set(false);
    }
  }

  async load(): Promise<void> {
    await this.loadExtractor();
  }

  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && typeof WebAssembly !== 'undefined';
  }

  private loadExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractorPromise) {
      this.status.set('checking');
      this.extractorPromise = this.createExtractor().catch((error) => {
        this.status.set('error');
        this.extractorPromise = undefined;
        throw error;
      });
    }
    return this.extractorPromise;
  }

  private async createExtractor(): Promise<FeatureExtractionPipeline> {
    const { pipeline, env } = await import('@huggingface/transformers');

    // Only ever fetch from the HF hub/CDN — never look for models bundled with the app.
    env.allowLocalModels = false;

    this.status.set('downloading');
    this.progress.set(0);

    const device =
      typeof navigator !== 'undefined' && (navigator as unknown as { gpu?: unknown }).gpu
        ? 'webgpu'
        : 'wasm';

    const extractor = await pipeline('feature-extraction', MODEL_ID, {
      device,
      dtype: 'q8',
      progress_callback: (event: { status: string; progress?: number }) => {
        if (event.status === 'progress' && typeof event.progress === 'number') {
          this.progress.set(Math.round(event.progress));
        }
        if (event.status === 'ready' || event.status === 'done') {
          this.status.set('loading');
        }
      },
    });

    this.status.set('ready');
    return extractor as unknown as FeatureExtractionPipeline;
  }

  async unload(): Promise<void> {
    this.extractorPromise = undefined;
    this.status.set('unavailable');
    this.progress.set(0);
  }
}
