import { initLlama } from 'llama.rn';
import type { LlamaContext } from 'llama.rn';

const MODEL_FILENAME = 'llama-3.2-3b-instruct-q4_k_m.gguf';

class LlamaService {
  private context: LlamaContext | null = null;
  private initializing = false;

  async initialize(modelPath: string): Promise<void> {
    if (this.context !== null || this.initializing) return;
    this.initializing = true;
    try {
      this.context = await initLlama({
        model: modelPath,
        n_ctx: 2048,
        use_mlock: true,
        n_threads: 4,
      });
    } finally {
      this.initializing = false;
    }
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
  }

  get isInitialized(): boolean {
    return this.context !== null;
  }
}

export const llamaService = new LlamaService();

export function getDefaultModelFilename(): string {
  return MODEL_FILENAME;
}
