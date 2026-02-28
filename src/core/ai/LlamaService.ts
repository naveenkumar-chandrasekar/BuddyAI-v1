import { initLlama } from 'llama.rn';
import type { LlamaContext } from 'llama.rn';
import { getSavedModelPath } from './ModelDownloadService';

const MODEL_FILENAME = 'llama-3.2-1b-instruct-q4_k_m.gguf';

class LlamaService {
  private context: LlamaContext | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(modelPath?: string): Promise<void> {
    if (this.context !== null) return;
    if (this.initPromise) return this.initPromise;

    const path = modelPath ?? getSavedModelPath();
    if (!path) throw new Error('Model not downloaded. Path not found.');

    this.initPromise = initLlama({
      model: path,
      n_ctx: 2048,
      use_mlock: true,
      n_threads: 4,
    }).then(ctx => {
      this.context = ctx;
      this.initPromise = null;
    }).catch(e => {
      this.initPromise = null;
      throw e;
    });

    return this.initPromise;
  }

  async complete(prompt: string): Promise<string> {
    if (this.context === null) {
      throw new Error('LlamaService not initialized. Call initialize() first.');
    }
    const result = await this.context.completion({
      prompt,
      n_predict: 512,
      temperature: 0.7,
      top_p: 0.9,
      stop: ['</s>', '<|end|>', '[INST]', '\n\n\n'],
    });
    return result.text.trim();
  }

  async release(): Promise<void> {
    if (this.context) {
      await this.context.release();
      this.context = null;
    }
    this.initPromise = null;
  }

  get isInitialized(): boolean {
    return this.context !== null;
  }

  get isLoading(): boolean {
    return this.initPromise !== null;
  }
}

export const llamaService = new LlamaService();

export function getDefaultModelFilename(): string {
  return MODEL_FILENAME;
}
