import { Q } from '@nozbe/watermelondb';
import { llamaService } from '../LlamaService';
import { parseDate } from '../DateParser';
import { getDb } from '../../../data/database/database';
import type ReminderModel from '../../../data/database/models/ReminderModel';

export type ReminderAgentResult =
  | { type: 'action'; action: string; data: Record<string, unknown>; message: string }
  | { type: 'question'; question: string; partial: Record<string, unknown> }
  | { type: 'error'; message: string };

const SYSTEM = `You are a reminder assistant. Reply ONLY in valid JSON, no other text.
{"action":"ACTION","message":"friendly 1-sentence reply","data":{}}

Actions and required data fields:
CREATE_REMINDER: {"title":"exact title from user message","priority":2,"is_recurring":false,"recurrence":""}
DONE_REMINDER: {"title":"exact reminder title from the reminder list below"}
SNOOZE_REMINDER: {"title":"exact reminder title from list","snooze_label":"30min|1h|2h|3h|6h|12h|1d"}
DELETE_REMINDER: {"title":"exact reminder title from the reminder list below"}

Rules:
- title must be copied EXACTLY from user message (CREATE) or reminder list (mutations)
- snooze_label: pick closest to what user says (30min, 1h, 2h, 3h, 6h, 12h, 1d)
- NEVER output remind_at or id fields
- NEVER invent reminder titles not in the list`;

const SNOOZE_LABEL_MS: Record<string, number> = {
  '30min': 30 * 60000,
  '1h': 60 * 60000,
  '2h': 2 * 60 * 60000,
  '3h': 3 * 60 * 60000,
  '6h': 6 * 60 * 60000,
  '12h': 12 * 60 * 60000,
  '1d': 24 * 60 * 60000,
};

function parseSnoozeMs(userText: string): number {
  const lower = userText.toLowerCase();
  const days = lower.match(/(\d+)\s*d(ay)?s?/);
  const hours = lower.match(/(\d+)\s*h(our)?s?/);
  const mins = lower.match(/(\d+)\s*m(in(ute)?s?)?/);
  if (days) return parseInt(days[1], 10) * 86400000;
  if (hours) return parseInt(hours[1], 10) * 3600000;
  if (mins) return parseInt(mins[1], 10) * 60000;
  return 3600000;
}

function fmtRemindAt(ms: number): string {
  const now = Date.now();
  const diff = ms - now;
  const d = new Date(ms);
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (diff < 0) return `overdue (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time})`;
  if (diff < 86400000) return `today at ${time}`;
  if (diff < 172800000) return `tomorrow at ${time}`;
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${time}`;
}

function fuzzyFind(hint: string, reminders: ReminderModel[]): ReminderModel | null {
  const lower = hint.toLowerCase().trim();
  return (
    reminders.find(r => r.title.toLowerCase() === lower) ??
    reminders.find(r => r.title.toLowerCase().includes(lower)) ??
    reminders.find(r => lower.includes(r.title.toLowerCase())) ??
    null
  );
}

async function loadActiveReminders(): Promise<ReminderModel[]> {
  return getDb()
    .collections.get<ReminderModel>('reminders')
    .query(
      Q.where('is_deleted', false),
      Q.where('is_done', false),
      Q.where('is_dismissed', false),
      Q.sortBy('remind_at', Q.asc),
      Q.take(12),
    )
    .fetch();
}

function buildContext(reminders: ReminderModel[]): string {
  if (reminders.length === 0) return 'Reminder list: empty';
  const now = Date.now();
  const lines = reminders.map(r => {
    const parts = [`"${r.title}"`, `[${fmtRemindAt(r.remindAt)}]`];
    if (r.snoozeUntil && r.snoozeUntil > now) {
      parts.push(`[snoozed until ${new Date(r.snoozeUntil).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}]`);
    }
    if (r.isRecurring) parts.push(`[recurring: ${r.recurrence ?? ''}]`);
    if (r.tags) parts.push(`[tags: ${r.tags}]`);
    return parts.join(' ');
  });
  return `Reminder list:\n${lines.join('\n')}`;
}

export async function processReminderMessage(
  userText: string,
  partial?: Record<string, unknown>,
): Promise<ReminderAgentResult> {
  if (!llamaService.isInitialized) return { type: 'error', message: 'AI model not loaded.' };

  const activeReminders = await loadActiveReminders();
  const context = buildContext(activeReminders);
  const prompt = `<|im_start|>system\n${SYSTEM}\n\n${context}<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n{"action":"`;

  try {
    const raw = await llamaService.complete(prompt);
    const jsonMatch = (`{"action":"` + raw).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { type: 'error', message: 'Could not understand that.' };

    const parsed = JSON.parse(jsonMatch[0]) as { action: string; message: string; data: Record<string, unknown> };
    if (!parsed.action || !parsed.message) return { type: 'error', message: 'Invalid response.' };

    const data: Record<string, unknown> = { ...partial, ...parsed.data };

    if (parsed.action === 'CREATE_REMINDER') {
      const title = String(data.title ?? '').trim();
      if (!title || !userText.toLowerCase().includes(title.toLowerCase())) {
        return { type: 'question', question: 'What should I remind you about?', partial: data };
      }
      const remindAt = parseDate(userText);
      if (remindAt) {
        data.remind_at = remindAt;
      } else if (!data.remind_at) {
        return {
          type: 'question',
          question: `When should I remind you about "${title}"? (e.g. today at 6pm, tomorrow morning)`,
          partial: data,
        };
      }
      return { type: 'action', action: 'CREATE_REMINDER', data, message: parsed.message };
    }

    if (['DONE_REMINDER', 'DELETE_REMINDER', 'SNOOZE_REMINDER'].includes(parsed.action)) {
      const titleHint = String(data.title ?? '').trim();
      if (!titleHint) return { type: 'question', question: 'Which reminder? Please give the title.', partial: data };
      const match = fuzzyFind(titleHint, activeReminders);
      if (!match) {
        const list = activeReminders.slice(0, 5).map(r => `"${r.title}"`).join(', ');
        return {
          type: 'question',
          question: `Couldn't find "${titleHint}". Your reminders: ${list || 'none'}. Which one?`,
          partial: { ...data, action: parsed.action },
        };
      }
      data.id = match.id;
      data.title = match.title;
      if (parsed.action === 'SNOOZE_REMINDER') {
        const label = String(data.snooze_label ?? '');
        data.snooze_ms = SNOOZE_LABEL_MS[label] ?? parseSnoozeMs(userText);
      }
      return { type: 'action', action: parsed.action, data, message: parsed.message };
    }

    return { type: 'action', action: parsed.action, data, message: parsed.message };
  } catch {
    return { type: 'error', message: 'Something went wrong.' };
  }
}
