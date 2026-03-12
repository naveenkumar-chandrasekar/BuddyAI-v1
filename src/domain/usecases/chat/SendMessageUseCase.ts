import { chatMessageRepository } from '../../../data/repositories/ChatRepository';
import { llamaService } from '../../../core/ai/LlamaService';
import { buildPrompt } from '../../../core/ai/PromptBuilder';
import { parseIntent, isConversationalOnly } from '../../../core/ai/IntentParser';
import { executeAction } from '../../../core/ai/ActionExecutor';
import { buildQueryTodayMessage, buildQueryUpcomingMessage, buildBirthdayMessage } from '../../../core/ai/QueryResponseBuilder';
import { classifyByKeyword } from '../../../core/ai/KeywordClassifier';
import { parseDate } from '../../../core/ai/DateParser';
import type { ChatMessage } from '../../models/Chat';

type PendingAction =
  | { action: 'CREATE_PERSON'; step: 'name'; data: Record<string, unknown> }
  | { action: 'CREATE_PERSON'; step: 'relationship'; data: Record<string, unknown> }
  | { action: 'CREATE_TASK'; step: 'title'; data: Record<string, unknown> }
  | { action: 'CREATE_TASK'; step: 'due_date'; data: Record<string, unknown> }
  | { action: 'CREATE_TODO'; step: 'title'; data: Record<string, unknown> }
  | { action: 'CREATE_TODO'; step: 'due_date'; data: Record<string, unknown> }
  | { action: 'CREATE_REMINDER'; step: 'title'; data: Record<string, unknown> }
  | { action: 'CREATE_REMINDER'; step: 'remind_at'; data: Record<string, unknown> };

let pending: PendingAction | null = null;

const RELATIONSHIP_MAP: Record<string, string> = {
  family: 'family', mom: 'family', dad: 'family', mother: 'family', father: 'family',
  brother: 'family', sister: 'family', wife: 'family', husband: 'family',
  son: 'family', daughter: 'family', uncle: 'family', aunt: 'family', cousin: 'family',
  college: 'friend', university: 'friend',
  school: 'school', classmate: 'school',
  office: 'work', work: 'work', colleague: 'work', coworker: 'work',
  boss: 'work', manager: 'work', employee: 'work',
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

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function fmtDateOnly(ms: number): string {
  return new Date(ms).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function askQuestion(pa: PendingAction): string {
  switch (pa.action) {
    case 'CREATE_PERSON':
      return pa.step === 'name'
        ? "What's the person's name?"
        : `Got it! What's ${String(pa.data.name)}'s relationship?\n(family / friend / work / school / other)`;
    case 'CREATE_TASK':
      return pa.step === 'title'
        ? "What's the task?"
        : `When is "${String(pa.data.title)}" due?\n(e.g. tomorrow, Friday at 5pm — or "skip")`;
    case 'CREATE_TODO':
      return pa.step === 'title'
        ? "What's the todo item?"
        : `Any due date for "${String(pa.data.title)}"?\n(e.g. tomorrow, Friday — or "skip")`;
    case 'CREATE_REMINDER':
      return pa.step === 'title'
        ? "What should I remind you about?"
        : `When should I remind you about "${String(pa.data.title)}"?\n(e.g. today at 6pm, tomorrow morning)`;
  }
}

async function storePending(sessionId: string, pa: PendingAction): Promise<ChatMessage> {
  pending = pa;
  return chatMessageRepository.create({
    sessionId, sender: 'ai', message: askQuestion(pa), messageType: 'text',
  });
}

async function resolvePending(
  sessionId: string,
  pa: PendingAction,
  userText: string,
): Promise<ChatMessage | null> {
  pending = null;

  // ── CREATE_PERSON ──────────────────────────────────────────────────────────
  if (pa.action === 'CREATE_PERSON' && pa.step === 'name') {
    const name = userText.trim();
    return storePending(sessionId, { action: 'CREATE_PERSON', step: 'relationship', data: { ...pa.data, name } });
  }

  if (pa.action === 'CREATE_PERSON' && pa.step === 'relationship') {
    const rel = extractRelationship(userText);
    if (!rel) {
      pending = pa;
      return chatMessageRepository.create({
        sessionId, sender: 'ai',
        message: "Please say one of: family, friend, work, school, other",
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

  // ── CREATE_TASK ────────────────────────────────────────────────────────────
  if (pa.action === 'CREATE_TASK' && pa.step === 'title') {
    const title = userText.trim();
    return storePending(sessionId, { action: 'CREATE_TASK', step: 'due_date', data: { ...pa.data, title } });
  }

  if (pa.action === 'CREATE_TASK' && pa.step === 'due_date') {
    const dueDate = parseDate(userText);
    const result = await executeAction({
      intent: 'TASK_INTENT', action: 'CREATE_TASK', message: '',
      data: { ...pa.data, ...(dueDate ? { due_date: dueDate } : {}) },
    });
    const title = String(pa.data.title);
    const dateStr = dueDate ? fmtDate(dueDate) : 'no due date';
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Added task "${title}" (${dateStr})!` : `Couldn't add task: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_TASK' : undefined,
      actionPayload: result.success ? JSON.stringify({ title, due_date: dueDate, success: true }) : undefined,
    });
  }

  // ── CREATE_TODO ────────────────────────────────────────────────────────────
  if (pa.action === 'CREATE_TODO' && pa.step === 'title') {
    const title = userText.trim();
    return storePending(sessionId, { action: 'CREATE_TODO', step: 'due_date', data: { ...pa.data, title } });
  }

  if (pa.action === 'CREATE_TODO' && pa.step === 'due_date') {
    const dueDate = parseDate(userText);
    const result = await executeAction({
      intent: 'TODO_INTENT', action: 'CREATE_TODO', message: '',
      data: { ...pa.data, ...(dueDate ? { due_date: dueDate } : {}) },
    });
    const title = String(pa.data.title);
    const dateStr = dueDate ? fmtDateOnly(dueDate) : 'no due date';
    return chatMessageRepository.create({
      sessionId, sender: 'ai',
      message: result.success ? `Added todo "${title}" (${dateStr})!` : `Couldn't add todo: ${result.message}`,
      messageType: result.success ? 'action' : 'error',
      actionType: result.success ? 'CREATE_TODO' : undefined,
      actionPayload: result.success ? JSON.stringify({ title, due_date: dueDate, success: true }) : undefined,
    });
  }

  // ── CREATE_REMINDER ────────────────────────────────────────────────────────
  if (pa.action === 'CREATE_REMINDER' && pa.step === 'title') {
    const title = userText.trim();
    return storePending(sessionId, { action: 'CREATE_REMINDER', step: 'remind_at', data: { ...pa.data, title } });
  }

  if (pa.action === 'CREATE_REMINDER' && pa.step === 'remind_at') {
    const remindAt = parseDate(userText);
    if (!remindAt) {
      pending = pa;
      return chatMessageRepository.create({
        sessionId, sender: 'ai',
        message: `I need a specific time. Try "today at 6pm" or "tomorrow morning".`,
        messageType: 'text',
      });
    }
    const result = await executeAction({
      intent: 'REMINDER_INTENT', action: 'CREATE_REMINDER', message: '',
      data: { ...pa.data, remind_at: remindAt },
    });
    const title = String(pa.data.title);
    const timeStr = fmtDate(remindAt);
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

    // ── CREATE_PERSON ────────────────────────────────────────────────────────
    if (intent.action === 'CREATE_PERSON') {
      const name = String(intent.data.name ?? '').trim();
      // Reject if name is empty OR if the LLM hallucinated it from context
      // (i.e. the name doesn't actually appear in what the user typed)
      const nameInMessage = name && userText.toLowerCase().includes(name.toLowerCase());
      if (!name || !nameInMessage) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_PERSON', step: 'name', data: {} });
        return { userMessage, aiMessage };
      }
      const detectedRel = extractRelationship(userText);
      if (detectedRel) {
        intent.data.relationship_type = detectedRel;
      } else {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_PERSON', step: 'relationship', data: intent.data });
        return { userMessage, aiMessage };
      }
    }

    // ── CREATE_TASK ──────────────────────────────────────────────────────────
    if (intent.action === 'CREATE_TASK') {
      const title = String(intent.data.title ?? '').trim();
      const titleInMsg = title && userText.toLowerCase().includes(title.toLowerCase());
      if (!title || !titleInMsg) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_TASK', step: 'title', data: {} });
        return { userMessage, aiMessage };
      }
      const parsedDate = parseDate(userText);
      if (parsedDate) {
        intent.data.due_date = parsedDate;
      } else if (!intent.data.due_date) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_TASK', step: 'due_date', data: intent.data });
        return { userMessage, aiMessage };
      }
    }

    // ── CREATE_TODO ──────────────────────────────────────────────────────────
    if (intent.action === 'CREATE_TODO') {
      const title = String(intent.data.title ?? '').trim();
      const titleInMsg = title && userText.toLowerCase().includes(title.toLowerCase());
      if (!title || !titleInMsg) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_TODO', step: 'title', data: {} });
        return { userMessage, aiMessage };
      }
      const parsedDate = parseDate(userText);
      if (parsedDate) {
        intent.data.due_date = parsedDate;
      } else if (!intent.data.due_date) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_TODO', step: 'due_date', data: intent.data });
        return { userMessage, aiMessage };
      }
    }

    // ── CREATE_REMINDER ──────────────────────────────────────────────────────
    if (intent.action === 'CREATE_REMINDER') {
      const title = String(intent.data.title ?? '').trim();
      const titleInMsg = title && userText.toLowerCase().includes(title.toLowerCase());
      if (!title || !titleInMsg) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_REMINDER', step: 'title', data: {} });
        return { userMessage, aiMessage };
      }
      const parsedDate = parseDate(userText);
      if (parsedDate) {
        intent.data.remind_at = parsedDate;
      } else if (!intent.data.remind_at) {
        const aiMessage = await storePending(sessionId, { action: 'CREATE_REMINDER', step: 'remind_at', data: intent.data });
        return { userMessage, aiMessage };
      }
    }

    // ── CREATE_CONNECTION ────────────────────────────────────────────────────
    if (intent.action === 'CREATE_CONNECTION') {
      const p1 = String(intent.data.person1_name ?? '').trim();
      const p2 = String(intent.data.person2_name ?? '').trim();
      const lower = userText.toLowerCase();
      if (!p1 || !p2 || !lower.includes(p1.toLowerCase()) || !lower.includes(p2.toLowerCase())) {
        const aiMessage = await chatMessageRepository.create({
          sessionId, sender: 'ai',
          message: "Please mention both people's names. e.g. \"relate John and Sarah as siblings\"",
          messageType: 'text',
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
