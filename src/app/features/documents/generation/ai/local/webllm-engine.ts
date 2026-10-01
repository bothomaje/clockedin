import { Service, signal } from '@angular/core';

export type ModelStatus =
  'unavailable' | 'checking' | 'downloading' | 'loading' | 'ready' | 'error';

const MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const CONTEXT_WINDOW_SIZE = 8192;

type ChatMessage = { role: 'system' | 'user'; content: string };

interface ChatCompletionResult {
  choices: { message: { content: string | null } }[];
}

interface MlcEngine {
  chat: {
    completions: {
      create(request: {
        messages: ChatMessage[];
        response_format: { type: 'json_object'; schema: string };
        temperature?: number;
      }): Promise<ChatCompletionResult>;
    };
  };
  unload(): Promise<void>;
}

/**
 * Lazily loads a small instruct model in the browser via WebLLM (WebGPU).
 * One engine instance is shared by every capability that uses it. Nothing
 * here talks to Firebase or leaves the device.
 */
@Service()
export class WebLlmEngine {
  readonly status = signal<ModelStatus>('unavailable');
  readonly progress = signal(0);
  readonly generating = signal(false);

  private enginePromise?: Promise<MlcEngine>;

  async load(): Promise<void> {
    await this.loadEngine();
  }

  async chat(
    systemInstruction: string,
    prompt: string,
    schema: Record<string, unknown>,
    temperature: number,
  ): Promise<string> {
    const engine = await this.loadEngine();

    this.generating.set(true);
    try {
      const result = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object', schema: JSON.stringify(schema) },
        temperature,
      });

      const content = result.choices[0]?.message.content;
      if (!content) {
        throw new Error('WebLLM returned an empty response.');
      }
      return content;
    } finally {
      this.generating.set(false);
    }
  }

  async isAvailable(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;

    try {
      const gpu = (navigator as unknown as { gpu: { requestAdapter(): Promise<unknown> } }).gpu;
      const adapter = await gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  private loadEngine(): Promise<MlcEngine> {
    if (!this.enginePromise) {
      this.status.set('checking');
      this.enginePromise = this.createEngine().catch((error) => {
        this.status.set('error');
        this.enginePromise = undefined;
        throw error;
      });
    }
    return this.enginePromise;
  }

  private async createEngine(): Promise<MlcEngine> {
    const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

    this.status.set('downloading');
    this.progress.set(0);

    const engine = await CreateMLCEngine(
      MODEL_ID,
      {
        initProgressCallback: (report: { progress: number }) => {
          this.progress.set(Math.round((report.progress ?? 0) * 100));
          if ((report.progress ?? 0) >= 1) this.status.set('loading');
        },
      },
      { context_window_size: CONTEXT_WINDOW_SIZE },
    );

    this.status.set('ready');
    return engine as unknown as MlcEngine;
  }

  async unload(): Promise<void> {
    if (!this.enginePromise) return;

    const engine = await this.enginePromise;
    await engine.unload();
    this.enginePromise = undefined;
    this.status.set('unavailable');
    this.progress.set(0);
  }
}
