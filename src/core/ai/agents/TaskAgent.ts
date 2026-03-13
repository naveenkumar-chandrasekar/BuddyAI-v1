import { Q } from '@nozbe/watermelondb';
import { llamaService } from '../LlamaService';
import { parseDate } from '../DateParser';
import { getDb } from '../../../data/database/database';
import { PRIORITY_LABELS, Priority } from '../../../shared/constants/priority';
import type TaskModel from '../../../data/database/models/TaskModel';

export type TaskAgentResult =
  | { type: 'action'; action: string; data: Record<string, unknown>; message: string }
  | { type: 'question'; question: string; partial: Record<string, unknown> }
  | { type: 'error'; message: string };

const SYSTEM = `You are a task manager assistant. Reply ONLY in valid JSON, no other text.
{"action":"ACTION","message":"friendly 1-sentence reply","data":{}}

Actions and required data fields:
CREATE_TASK: {"title":"exact title from user message","priority":2,"tags":"csv","estimated_minutes":30,"is_recurring":false,"recurrence":""}
COMPLETE_TASK: {"title":"exact task title from the task list below"}
CANCEL_TASK: {"title":"exact task title from the task list below"}
DELETE_TASK: {"title":"exact task title from the task list below"}

Rules:
- title must be copied EXACTLY from user message (for CREATE) or task list (for mutations)
- priority: 1=high/urgent, 2=medium(default), 3=low
- NEVER invent titles not mentioned by the user
- NEVER output due_date or id fields`;

function fmtDate(ms: number): string {
  const d = new Date(ms);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const dStart = new Date(ms); dStart.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dStart.getTime() - todayStart.getTime()) / 86400000);
  if (diffDays === 0) return `today ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function parsePriority(text: string): number | null {
  const lower = text.toLowerCase();
  if (/\b(urgent|high|critical|asap|important)\b/.test(lower)) return Priority.HIGH;
  if (/\b(low|minor|whenever|sometime)\b/.test(lower)) return Priority.LOW;
  return null;
}

function fuzzyFind(hint: string, tasks: TaskModel[]): TaskModel | null {
  const lower = hint.toLowerCase().trim();
  return (
    tasks.find(t => t.title.toLowerCase() === lower) ??
    tasks.find(t => t.title.toLowerCase().includes(lower)) ??
    tasks.find(t => lower.includes(t.title.toLowerCase())) ??
    null
  );
}

async function loadActiveTasks(): Promise<TaskModel[]> {
  return getDb()
    .collections.get<TaskModel>('tasks')
    .query(
      Q.where('is_deleted', false),
      Q.where('status', Q.notIn(['done', 'dismissed', 'cancelled'])),
      Q.sortBy('due_date', Q.asc),
      Q.take(12),
    )
    .fetch();
}

function buildContext(tasks: TaskModel[]): string {
  if (tasks.length === 0) return 'Task list: empty';
  const lines = tasks.map(t => {
    const parts = [`"${t.title}"`, `[${PRIORITY_LABELS[t.priority as keyof typeof PRIORITY_LABELS] ?? 'Medium'}]`];
    if (t.dueDate) parts.push(`[due: ${fmtDate(t.dueDate)}]`);
    if (t.tags) parts.push(`[tags: ${t.tags}]`);
    if (t.estimatedMinutes) parts.push(`[est: ${t.estimatedMinutes}min]`);
    if (t.isRecurring) parts.push('[recurring]');
    return parts.join(' ');
  });
  return `Task list:\n${lines.join('\n')}`;
}

export async function processTaskMessage(
  userText: string,
  partial?: Record<string, unknown>,
): Promise<TaskAgentResult> {
  if (!llamaService.isInitialized) return { type: 'error', message: 'AI model not loaded.' };

  const activeTasks = await loadActiveTasks();
  const context = buildContext(activeTasks);
  const prompt = `<|im_start|>system\n${SYSTEM}\n\n${context}<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n{"action":"`;

  try {
    const raw = await llamaService.complete(prompt);
    const jsonMatch = (`{"action":"` + raw).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { type: 'error', message: 'Could not understand that.' };

    const parsed = JSON.parse(jsonMatch[0]) as { action: string; message: string; data: Record<string, unknown> };
    if (!parsed.action || !parsed.message) return { type: 'error', message: 'Invalid response.' };

    const data: Record<string, unknown> = { ...partial, ...parsed.data };

    if (parsed.action === 'CREATE_TASK') {
      const title = String(data.title ?? '').trim();
      if (!title || !userText.toLowerCase().includes(title.toLowerCase())) {
        return { type: 'question', question: "What's the task title?", partial: data };
      }
      const detectedPriority = parsePriority(userText);
      if (detectedPriority) data.priority = detectedPriority;
      const dueDate = parseDate(userText);
      if (dueDate) {
        data.due_date = dueDate;
      } else if (!data.due_date) {
        return {
          type: 'question',
          question: `When is "${title}" due? (e.g. tomorrow 5pm, Friday — or "skip")`,
          partial: data,
        };
      }
      return { type: 'action', action: 'CREATE_TASK', data, message: parsed.message };
    }

    if (['COMPLETE_TASK', 'CANCEL_TASK', 'DELETE_TASK'].includes(parsed.action)) {
      const titleHint = String(data.title ?? '').trim();
      if (!titleHint) return { type: 'question', question: 'Which task? Please give the title.', partial: data };
      const match = fuzzyFind(titleHint, activeTasks);
      if (!match) {
        const list = activeTasks.slice(0, 5).map(t => `"${t.title}"`).join(', ');
        return {
          type: 'question',
          question: `Couldn't find "${titleHint}". Your tasks: ${list || 'none'}. Which one?`,
          partial: { ...data, action: parsed.action },
        };
      }
      data.id = match.id;
      data.title = match.title;
      return { type: 'action', action: parsed.action, data, message: parsed.message };
    }

    return { type: 'action', action: parsed.action, data, message: parsed.message };
  } catch {
    return { type: 'error', message: 'Something went wrong.' };
  }
}
