import { llamaService } from '../../../core/ai/LlamaService';
import { buildDailySummaryPrompt } from '../../../core/ai/PromptBuilder';
import { generateDailySummary, formatDailySummaryBody } from './GenerateDailySummaryUseCase';

export async function generateAIDailySummary(): Promise<string> {
  if (!llamaService.isInitialized) {
    const summary = await generateDailySummary();
    return formatDailySummaryBody(summary);
  }

  try {
    const prompt = await buildDailySummaryPrompt();
    return await llamaService.complete(prompt);
  } catch {
    const summary = await generateDailySummary();
    return formatDailySummaryBody(summary);
  }
}
