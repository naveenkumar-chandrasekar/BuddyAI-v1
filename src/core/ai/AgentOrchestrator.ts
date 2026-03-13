import { routeMessage, type Domain } from './agents/RouterAgent';
import { processTaskMessage } from './agents/TaskAgent';
import { processTodoMessage } from './agents/TodoAgent';
import { processReminderMessage } from './agents/ReminderAgent';
import { processPeopleMessage } from './agents/PeopleAgent';
import { executeAction } from './ActionExecutor';
import {
  buildQueryTodayMessage,
  buildQueryUpcomingMessage,
  buildBirthdayMessage,
} from './QueryResponseBuilder';
import { llamaService } from './LlamaService';

export type OrchestratorResult =
  | { type: 'reply'; message: string; actionType?: string }
  | { type: 'question'; message: string }
  | { type: 'error'; message: string };

type PendingState = {
  domain: Domain;
  action: string;
  partial: Record<string, unknown>;
};

let pending: PendingState | null = null;

export function clearPending(): void {
  pending = null;
}

async function runAgent(
  domain: Domain,
  userText: string,
  partial?: Record<string, unknown>,
): Promise<OrchestratorResult> {
  if (domain === 'query_today') {
    return { type: 'reply', message: await buildQueryTodayMessage() };
  }
  if (domain === 'query_upcoming') {
    return { type: 'reply', message: await buildQueryUpcomingMessage() };
  }
  if (domain === 'query_birthdays') {
    return { type: 'reply', message: await buildBirthdayMessage() };
  }
  if (domain === 'chat') {
    if (!llamaService.isInitialized) return { type: 'reply', message: "AI model is loading. Please wait." };
    const prompt = `<|im_start|>system\nYou are BuddyAi, a friendly personal assistant. Reply in 1-2 sentences.<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n`;
    try {
      const reply = await llamaService.complete(prompt);
      return { type: 'reply', message: reply };
    } catch {
      return { type: 'reply', message: "Hello! How can I help you today?" };
    }
  }

  let result;
  if (domain === 'task') result = await processTaskMessage(userText, partial);
  else if (domain === 'todo') result = await processTodoMessage(userText, partial);
  else if (domain === 'reminder') result = await processReminderMessage(userText, partial);
  else result = await processPeopleMessage(userText, partial);

  if (result.type === 'error') return { type: 'error', message: result.message };

  if (result.type === 'question') {
    pending = { domain, action: '', partial: result.partial };
    return { type: 'question', message: result.question };
  }

  const execResult = await executeAction({
    intent: '', action: result.action, message: result.message, data: result.data,
  });

  if (!execResult.success) {
    return { type: 'error', message: execResult.message ?? 'Action failed.' };
  }

  return { type: 'reply', message: result.message, actionType: result.action };
}

export async function processMessage(userText: string): Promise<OrchestratorResult> {
  if (pending) {
    const currentPending = pending;
    pending = null;

    if (userText.toLowerCase().trim() === 'skip') {
      return runAgent(currentPending.domain, userText, currentPending.partial);
    }
    return runAgent(currentPending.domain, userText, currentPending.partial);
  }

  const domain = await routeMessage(userText);
  return runAgent(domain, userText);
}
