import { chatMessageRepository } from '../../../data/repositories/ChatRepository';
import { llamaService } from '../../../core/ai/LlamaService';
import { buildPrompt } from '../../../core/ai/PromptBuilder';
import { parseIntent, isConversationalOnly } from '../../../core/ai/IntentParser';
import { executeAction } from '../../../core/ai/ActionExecutor';
import { buildQueryTodayMessage, buildQueryUpcomingMessage, buildBirthdayMessage } from '../../../core/ai/QueryResponseBuilder';
import { classifyByKeyword } from '../../../core/ai/KeywordClassifier';
import { parseDate, hasDateInText } from '../../../core/ai/DateParser';
import type { ChatMessage } from '../../models/Chat';

type PendingAction =
  | { action: 'CREATE_PERSON'; step: 'relationship'; data: Record<string, unknown> }
  | { action: 'CREATE_TASK'; step: 'due_date'; data: Record<string, unknown> }
  | { action: 'CREATE_TODO'; step: 'due_date'; data: Record<string, unknown> }
  | { action: 'CREATE_REMINDER'; step: 'remind_at'; data: Record<string, unknown> };

let pending: PendingAction | null = null;

const RELATIONSHIP_MAP: Record<string, string> = {
  family: 'family', mom: 'family', dad: 'family', mother: 'family', father: 'family',
  brother: 'family', sister: 'family', wife: 'family', husband: 'family',
  son: 'family', daughter: 'family', uncle: 'family', aunt: 'family', cousin: 'family',
  college: 'college', university: 'college',
  school: 'school', classmate: 'school',
  office: 'office', work: 'office', colleague: 'office', coworker: 'office',
  boss: 'office', manager: 'office', employee: 'office',
  friend: 'other', buddy: 'other', neighbor: 'other', neighbour: 'other',
  other: 'other', custom: 'custom',
};

function extractRelationship(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(RELATIONSHIP_MAP)) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) return val;
  }
  return null;
}

async function savePending(sessionId: string, pa: PendingAction): Promise<ChatMessage> {
  let question: string;
  if (pa.action === 'CREATE_PERSON') {
    question = `Got it! What's ${String(pa.data.name)}'s relationship group?\n(family / college / school / office / other)`;
  } else if (pa.action === 'CREATE_TASK') {
    question = `When is "${String(pa.data.title)}" due?\n(e.g. tomorrow, Friday, March 15 — or say "skip")`;
  } else if (pa.action === 'CREATE_TODO') {
    question = `Any due date for "${String(pa.data.title)}"?\n(e.g. tomorrow, Friday — or say "skip")`;
  } else {
    question = `When should I remind you about "${String(pa.data.title)}"?\n(e.g. today at 6pm, tomorrow morning)`;
  }
  pending = pa;
  return chatMessageRepository.create({
    sessionId,
    sender: 'ai',
    message: question,
    messageType: 'text',
  });
}

async function resolvePending(
  sessionId: string,
  pa: PendingAction,
  userText: string,
): Promise<ChatMessage | null> {
  pending = null;

  if (pa.action === 'CREATE_PERSON') {
    const rel = extractRelationship(userText);
    if (!rel) {
      return chatMessageRepository.create({
        sessionId, sender: 'ai',
        message: `I didn't catch that. Please say one of: family, college, school, office, other`,
        messageType: 'text',
      });
    }
    const result = await executeAction({
      intent: 'PEOPLE_INTENT', action: 'CREATE_PERSON', message: '',
      data: { ...pa.data, relationship_type: rel },
    });
    const name = String(pa.data.name);
    const relLabel = rel.charAt(0).toUpperCase() + rel.slice(1);
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Done! Added ${name} under ${relLabel}.` : `Couldn't add ${name}: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_PERSON' : undefined,
      actionPayload: result.success ? JSON.stringify({ name, relationship_type: rel, success: true }) : undefined,
    });
  }

  if (pa.action === 'CREATE_TASK') {
    const dueDate = parseDate(userText);
    const result = await executeAction({
      intent: 'TASK_INTENT', action: 'CREATE_TASK', message: '',
      data: { ...pa.data, ...(dueDate ? { due_date: dueDate } : {}) },
    });
    const title = String(pa.data.title);
    const dateStr = dueDate ? new Date(dueDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'no due date';
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Added task "${title}" (${dateStr})!` : `Couldn't add task: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_TASK' : undefined,
      actionPayload: result.success ? JSON.stringify({ title, due_date: dueDate, success: true }) : undefined,
    });
  }

  if (pa.action === 'CREATE_TODO') {
    const dueDate = parseDate(userText);
    const result = await executeAction({
      intent: 'TODO_INTENT', action: 'CREATE_TODO', message: '',
      data: { ...pa.data, ...(dueDate ? { due_date: dueDate } : {}) },
    });
    const title = String(pa.data.title);
    const dateStr = dueDate ? new Date(dueDate).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'no due date';
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Added todo "${title}" (${dateStr})!` : `Couldn't add todo: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_TODO' : undefined,
      actionPayload: result.success ? JSON.stringify({ title, due_date: dueDate, success: true }) : undefined,
    });
  }

  if (pa.action === 'CREATE_REMINDER') {
    const remindAt = parseDate(userText);
    if (!remindAt) {
      pending = pa;
      return chatMessageRepository.create({
        sessionId, sender: 'ai',
        message: `I need a time to set the reminder. Try "today at 6pm" or "tomorrow morning".`,
        messageType: 'text',
      });
    }
    const result = await executeAction({
      intent: 'REMINDER_INTENT', action: 'CREATE_REMINDER', message: '',
      data: { ...pa.data, remind_at: remindAt },
    });
    const title = String(pa.data.title);
    const timeStr = new Date(remindAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Reminder set for "${title}" on ${timeStr}!` : `Couldn't set reminder: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_REMINDER' : undefined,
      actionPayload: result.success ? JSON.stringify({ title, remind_at: remindAt, success: true }) : undefined,
    });
  }

  return null;
}

export async function sendMessage(
  sessionId: string,
  userText: string,
): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
  const userMessage = await chatMessageRepository.create({
    sessionId, sender: 'user', message: userText, messageType: 'text',
  });

  if (!llamaService.isInitialized) {
    const aiMessage = await chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: 'AI model is not loaded yet. Please wait while it initializes.',
      messageType: 'error',
    });
    return { userMessage, aiMessage };
  }

  try {
    if (pending) {
      const currentPending = pending;
      const resolved = await resolvePending(sessionId, currentPending, userText);
      if (resolved) return { userMessage, aiMessage: resolved };
    }

    const keywordIntent = classifyByKeyword(userText);
    let intent = keywordIntent;

    if (!intent) {
      const prompt = await buildPrompt(sessionId, userText);
      const rawResponse = await llamaService.complete(prompt);
      intent = parseIntent(rawResponse);
    }

    if (intent.action === 'CREATE_PERSON') {
      const name = String(intent.data.name ?? '').trim();
      if (!name) {
        const aiMessage = await chatMessageRepository.create({
          sessionId, sender: 'ai', message: "What's the person's name?", messageType: 'text',
        });
        return { userMessage, aiMessage };
      }
      if (!extractRelationship(userText)) {
        const aiMessage = await savePending(sessionId, {
          action: 'CREATE_PERSON', step: 'relationship', data: intent.data,
        });
        return { userMessage, aiMessage };
      }
    }

    if (intent.action === 'CREATE_TASK') {
      const title = String(intent.data.title ?? '').trim();
      if (title && !hasDateInText(userText) && !intent.data.due_date) {
        const aiMessage = await savePending(sessionId, {
          action: 'CREATE_TASK', step: 'due_date', data: intent.data,
        });
        return { userMessage, aiMessage };
      }
    }

    if (intent.action === 'CREATE_TODO') {
      const title = String(intent.data.title ?? '').trim();
      if (title && !hasDateInText(userText) && !intent.data.due_date) {
        const aiMessage = await savePending(sessionId, {
          action: 'CREATE_TODO', step: 'due_date', data: intent.data,
        });
        return { userMessage, aiMessage };
      }
    }

    if (intent.action === 'CREATE_REMINDER') {
      const title = String(intent.data.title ?? '').trim();
      if (title && !hasDateInText(userText) && !intent.data.remind_at) {
        const aiMessage = await savePending(sessionId, {
          action: 'CREATE_REMINDER', step: 'remind_at', data: intent.data,
        });
        return { userMessage, aiMessage };
      }
    }

    let actionType: string | undefined;
    let actionPayload: string | undefined;
    let finalMessage = intent.message;

    if (intent.action === 'QUERY_TODAY') {
      finalMessage = await buildQueryTodayMessage();
    } else if (intent.action === 'QUERY_UPCOMING') {
      finalMessage = await buildQueryUpcomingMessage();
    } else if (intent.action === 'QUERY_BIRTHDAYS') {
      finalMessage = await buildBirthdayMessage();
    } else if (!isConversationalOnly(intent)) {
      const result = await executeAction(intent);
      actionType = intent.action;
      actionPayload = JSON.stringify({ ...intent.data, success: result.success });
      if (!result.success && result.message) finalMessage = result.message;
    }

    const aiMessage = await chatMessageRepository.create({
      sessionId, sender: 'ai', message: finalMessage,
      messageType: isConversationalOnly(intent) ? 'text' : 'action',
      actionType,
      actionPayload,
    });

    return { userMessage, aiMessage };
  } catch {
    pending = null;
    const aiMessage = await chatMessageRepository.create({
      sessionId, sender: 'ai', message: 'Something went wrong. Please try again.', messageType: 'error',
    });
    return { userMessage, aiMessage };
  }
}
