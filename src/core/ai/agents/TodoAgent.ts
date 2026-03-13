import { Q } from '@nozbe/watermelondb';
import { llamaService } from '../LlamaService';
import { parseDate } from '../DateParser';
import { getDb } from '../../../data/database/database';
import type TodoModel from '../../../data/database/models/TodoModel';
import type TodoItemModel from '../../../data/database/models/TodoItemModel';

export type TodoAgentResult =
  | { type: 'action'; action: string; data: Record<string, unknown>; message: string }
  | { type: 'question'; question: string; partial: Record<string, unknown> }
  | { type: 'error'; message: string };

const SYSTEM = `You are a todo list assistant. Reply ONLY in valid JSON, no other text.
{"action":"ACTION","message":"friendly 1-sentence reply","data":{}}

Actions and required data fields:
CREATE_TODO: {"title":"exact title from user message","priority":2,"description":"","tags":"csv","estimated_minutes":0}
COMPLETE_TODO: {"title":"exact todo title from the todo list below"}
DELETE_TODO: {"title":"exact todo title from the todo list below"}
CREATE_TODO_ITEM: {"todo_title":"exact parent todo title from list","title":"new item title"}
TOGGLE_TODO_ITEM: {"todo_title":"exact parent todo title","item_title":"exact item title from items list"}

Rules:
- title must be copied EXACTLY from user message (CREATE) or todo list (mutations)
- priority: 1=high, 2=medium(default), 3=low
- NEVER invent titles not mentioned by the user
- NEVER output due_date or id fields`;

function fuzzyFind<T extends { title: string }>(hint: string, items: T[]): T | null {
  const lower = hint.toLowerCase().trim();
  return (
    items.find(i => i.title.toLowerCase() === lower) ??
    items.find(i => i.title.toLowerCase().includes(lower)) ??
    items.find(i => lower.includes(i.title.toLowerCase())) ??
    null
  );
}

async function loadActiveTodos(): Promise<TodoModel[]> {
  return getDb()
    .collections.get<TodoModel>('todos')
    .query(
      Q.where('is_deleted', false),
      Q.where('is_completed', false),
      Q.sortBy('due_date', Q.asc),
      Q.take(12),
    )
    .fetch();
}

async function loadItemsForTodos(todoIds: string[]): Promise<Record<string, TodoItemModel[]>> {
  if (todoIds.length === 0) return {};
  const items = await getDb()
    .collections.get<TodoItemModel>('todo_items')
    .query(
      Q.where('is_deleted', false),
      Q.where('todo_id', Q.oneOf(todoIds)),
      Q.sortBy('position', Q.asc),
    )
    .fetch();
  const map: Record<string, TodoItemModel[]> = {};
  for (const item of items) {
    if (!map[item.todoId]) map[item.todoId] = [];
    map[item.todoId].push(item);
  }
  return map;
}

function buildContext(todos: TodoModel[], itemsMap: Record<string, TodoItemModel[]>): string {
  if (todos.length === 0) return 'Todo list: empty';
  const lines = todos.map(t => {
    const parts = [`"${t.title}"`];
    if (t.dueDate) {
      parts.push(`[due: ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}]`);
    }
    const items = itemsMap[t.id] ?? [];
    if (items.length > 0) {
      const done = items.filter(i => i.isCompleted).length;
      parts.push(`[${done}/${items.length} items done]`);
      const pending = items.filter(i => !i.isCompleted).slice(0, 3).map(i => `"${i.title}"`);
      if (pending.length > 0) parts.push(`items: ${pending.join(', ')}`);
    }
    if (t.tags) parts.push(`[tags: ${t.tags}]`);
    return parts.join(' ');
  });
  return `Todo list:\n${lines.join('\n')}`;
}

export async function processTodoMessage(
  userText: string,
  partial?: Record<string, unknown>,
): Promise<TodoAgentResult> {
  if (!llamaService.isInitialized) return { type: 'error', message: 'AI model not loaded.' };

  const todos = await loadActiveTodos();
  const itemsMap = await loadItemsForTodos(todos.map(t => t.id));
  const context = buildContext(todos, itemsMap);
  const prompt = `<|im_start|>system\n${SYSTEM}\n\n${context}<|im_end|>\n<|im_start|>user\n${userText}<|im_end|>\n<|im_start|>assistant\n{"action":"`;

  try {
    const raw = await llamaService.complete(prompt);
    const jsonMatch = (`{"action":"` + raw).match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { type: 'error', message: 'Could not understand that.' };

    const parsed = JSON.parse(jsonMatch[0]) as { action: string; message: string; data: Record<string, unknown> };
    if (!parsed.action || !parsed.message) return { type: 'error', message: 'Invalid response.' };

    const data: Record<string, unknown> = { ...partial, ...parsed.data };

    if (parsed.action === 'CREATE_TODO') {
      const title = String(data.title ?? '').trim();
      if (!title || !userText.toLowerCase().includes(title.toLowerCase())) {
        return { type: 'question', question: "What's the todo title?", partial: data };
      }
      const dueDate = parseDate(userText);
      if (dueDate) data.due_date = dueDate;
      return { type: 'action', action: 'CREATE_TODO', data, message: parsed.message };
    }

    if (parsed.action === 'COMPLETE_TODO' || parsed.action === 'DELETE_TODO') {
      const titleHint = String(data.title ?? '').trim();
      if (!titleHint) return { type: 'question', question: 'Which todo? Please give the title.', partial: data };
      const match = fuzzyFind(titleHint, todos);
      if (!match) {
        const list = todos.slice(0, 5).map(t => `"${t.title}"`).join(', ');
        return {
          type: 'question',
          question: `Couldn't find "${titleHint}". Your todos: ${list || 'none'}. Which one?`,
          partial: { ...data, action: parsed.action },
        };
      }
      data.id = match.id;
      data.title = match.title;
      return { type: 'action', action: parsed.action, data, message: parsed.message };
    }

    if (parsed.action === 'CREATE_TODO_ITEM') {
      const todoTitleHint = String(data.todo_title ?? '').trim();
      const itemTitle = String(data.title ?? '').trim();
      if (!itemTitle) return { type: 'question', question: 'What item should I add?', partial: data };
      const parentTodo = fuzzyFind(todoTitleHint, todos);
      if (!parentTodo) {
        const list = todos.slice(0, 5).map(t => `"${t.title}"`).join(', ');
        return {
          type: 'question',
          question: `Which todo should I add "${itemTitle}" to? Your todos: ${list || 'none'}`,
          partial: { ...data, title: itemTitle },
        };
      }
      data.todo_id = parentTodo.id;
      data.title = itemTitle;
      return { type: 'action', action: 'CREATE_TODO_ITEM', data, message: parsed.message };
    }

    if (parsed.action === 'TOGGLE_TODO_ITEM') {
      const todoTitleHint = String(data.todo_title ?? '').trim();
      const itemTitleHint = String(data.item_title ?? data.title ?? '').trim();
      const parentTodo = fuzzyFind(todoTitleHint, todos);
      if (!parentTodo) {
        const list = todos.slice(0, 5).map(t => `"${t.title}"`).join(', ');
        return { type: 'question', question: `Which todo? Your todos: ${list || 'none'}`, partial: data };
      }
      const items = itemsMap[parentTodo.id] ?? [];
      const item = fuzzyFind(itemTitleHint, items);
      if (!item) {
        const itemList = items.map(i => `"${i.title}"`).join(', ');
        return {
          type: 'question',
          question: `Which item in "${parentTodo.title}"? Items: ${itemList || 'none'}`,
          partial: data,
        };
      }
      data.id = item.id;
      data.todo_id = parentTodo.id;
      return { type: 'action', action: 'TOGGLE_TODO_ITEM', data, message: parsed.message };
    }

    return { type: 'action', action: parsed.action, data, message: parsed.message };
  } catch {
    return { type: 'error', message: 'Something went wrong.' };
  }
}
