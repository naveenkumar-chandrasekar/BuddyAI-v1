import { taskRepository, todoRepository, reminderRepository } from '../../data/repositories/TaskRepository';
import { peopleRepository } from '../../data/repositories/PeopleRepository';
import { chatMessageRepository } from '../../data/repositories/ChatRepository';
import { TaskStatus } from '../../shared/constants/taskStatus';
import { PRIORITY_LABELS } from '../../shared/constants/priority';
import { storage } from '../storage/mmkv';

const SYSTEM_PROMPT = `You are BuddyAi, a friendly personal assistant app.
You help manage people, tasks, todos, and reminders.
Detect the language of the user's message and always respond in that same language.
The JSON structure must always be in English. Only the "message" field should be in the user's language.

Always respond ONLY in this exact JSON format, nothing else:
{
  "intent": "INTENT_TYPE",
  "action": "ACTION_TYPE",
  "message": "Conversational response in user's language",
  "data": {}
}

Valid intents and actions:
PEOPLE_INTENT: CREATE_PERSON, UPDATE_PERSON, DELETE_PERSON, GET_PERSON, LIST_PEOPLE, ADD_BIRTHDAY
TASK_INTENT: CREATE_TASK, UPDATE_TASK, COMPLETE_TASK, DELETE_TASK, LIST_TASKS, LIST_TASKS_FOR_PERSON
TODO_INTENT: CREATE_TODO, COMPLETE_TODO, DELETE_TODO, LIST_TODOS, LIST_TODOS_FOR_PERSON
REMINDER_INTENT: CREATE_REMINDER, UPDATE_REMINDER, DELETE_REMINDER, LIST_REMINDERS, CREATE_RECURRING
QUERY_INTENT: QUERY_TODAY, QUERY_UPCOMING, QUERY_BIRTHDAYS, QUERY_OVERDUE, QUERY_PERSON_SUMMARY, QUERY_PRIORITY
MISSED_INTENT: DISMISS_MISSED_ITEM, LIST_MISSED_ITEMS, SNOOZE_MISSED_ITEM
SUMMARY_INTENT: DAILY_SUMMARY, GENERATE_SUMMARY, PERSON_SUMMARY
SETTINGS_INTENT: UPDATE_NOTIF_TIME, UPDATE_BIRTHDAY_THRESHOLD, TOGGLE_NOTIFICATIONS
CONVERSATION_INTENT: GENERAL_CHAT, UNKNOWN`;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function todayStart(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function todayEnd(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export async function buildPrompt(
  sessionId: string,
  userMessage: string,
): Promise<string> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const userName = storage.getString('user_name') ?? 'User';

  const start = todayStart();
  const end = todayEnd();
  const nowMs = now.getTime();

  const [allPeople, allTasks, allTodos, allReminders, recentMessages] = await Promise.all([
    peopleRepository.getAll(),
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
    chatMessageRepository.getRecentBySessionId(sessionId, 10),
  ]);

  const peopleSummary = allPeople.length === 0
    ? 'No people added yet.'
    : allPeople.map(p => `${p.name} (${p.relationshipType}, priority: ${PRIORITY_LABELS[p.priority]})`).join(', ');

  const todayTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED,
  );
  const tasksSummary = todayTasks.length === 0
    ? 'No tasks due today.'
    : todayTasks.map(t => `- ${t.title} [${PRIORITY_LABELS[t.priority]}]`).join('\n');

  const todayTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end && !t.isCompleted,
  );
  const todosSummary = todayTodos.length === 0
    ? 'No todos due today.'
    : todayTodos.map(t => `- ${t.title}`).join('\n');

  const todayReminders = allReminders.filter(
    r => r.remindAt >= start && r.remindAt <= end && !r.isDone,
  );
  const remindersSummary = todayReminders.length === 0
    ? 'No reminders today.'
    : todayReminders.map(r => `- ${r.title} at ${new Date(r.remindAt).toLocaleTimeString()}`).join('\n');

  const missedTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate < start &&
      (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) && !t.isDismissed,
  );
  const missedTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate < start && !t.isCompleted && !t.isDismissed,
  );
  const missedReminders = allReminders.filter(
    r => r.remindAt < nowMs && !r.isDone && !r.isDismissed,
  );
  const missedTotal = missedTasks.length + missedTodos.length + missedReminders.length;
  const missedSummary = missedTotal === 0
    ? 'No missed items.'
    : `${missedTotal} missed item(s): ${[
        ...missedTasks.map(t => t.title),
        ...missedTodos.map(t => t.title),
        ...missedReminders.map(r => r.title),
      ].join(', ')}`;

  const birthdayPeople = allPeople.filter(p => {
    if (!p.birthday) return false;
    const [, m, d] = p.birthday.split('-').map(Number);
    const bd = new Date(now.getFullYear(), m - 1, d);
    const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
    return diff >= 0 && diff <= 14;
  });
  const birthdaysSummary = birthdayPeople.length === 0
    ? 'No upcoming birthdays.'
    : birthdayPeople.map(p => {
        const [, m, d] = p.birthday!.split('-').map(Number);
        const bd = new Date(now.getFullYear(), m - 1, d);
        const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
        return `${p.name}: ${diff === 0 ? 'TODAY!' : `in ${diff} day(s) (${formatDate(bd.getTime())})`}`;
      }).join(', ');

  const chatHistory = recentMessages.length === 0
    ? 'No previous messages in this session.'
    : recentMessages
        .map(msg => `${msg.sender === 'user' ? userName : 'BuddyAi'}: ${msg.message}`)
        .join('\n');

  return `${SYSTEM_PROMPT}

Today's date: ${dateStr}
Current time: ${timeStr}
User name: ${userName}

User's people: ${peopleSummary}
Today's tasks: ${tasksSummary}
Today's todos: ${todosSummary}
Today's reminders: ${remindersSummary}
Missed items: ${missedSummary}
Upcoming birthdays: ${birthdaysSummary}

Recent chat history:
${chatHistory}

[USER MESSAGE]
${userMessage}

[ASSISTANT]`;
}

export async function buildDailySummaryPrompt(): Promise<string> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const userName = storage.getString('user_name') ?? 'User';

  const start = todayStart();
  const end = todayEnd();
  const nowMs = now.getTime();

  const [allTasks, allTodos, allReminders, allPeople] = await Promise.all([
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
    peopleRepository.getAll(),
  ]);

  const todayTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE,
  );
  const todayTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end && !t.isCompleted,
  );
  const todayReminders = allReminders.filter(
    r => r.remindAt >= start && r.remindAt <= end && !r.isDone,
  );
  const missedCount =
    allTasks.filter(t => t.dueDate !== null && t.dueDate < start && !t.isDismissed && t.status !== TaskStatus.DONE).length +
    allTodos.filter(t => t.dueDate !== null && t.dueDate < start && !t.isCompleted && !t.isDismissed).length +
    allReminders.filter(r => r.remindAt < nowMs && !r.isDone && !r.isDismissed).length;

  const birthdayPeople = allPeople.filter(p => {
    if (!p.birthday) return false;
    const [, m, d] = p.birthday.split('-').map(Number);
    const bd = new Date(now.getFullYear(), m - 1, d);
    const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
    return diff >= 0 && diff <= 14;
  });

  return `You are BuddyAi, a friendly personal assistant. Generate a warm, concise daily summary greeting for ${userName}.
Today is ${dateStr}.
Tasks due today: ${todayTasks.map(t => t.title).join(', ') || 'none'}
Todos due today: ${todayTodos.map(t => t.title).join(', ') || 'none'}
Reminders today: ${todayReminders.map(r => r.title).join(', ') || 'none'}
Missed items: ${missedCount}
Upcoming birthdays: ${birthdayPeople.map(p => p.name).join(', ') || 'none'}

Write a friendly 2-3 sentence summary. Be warm and encouraging. No JSON needed, just plain text.`;
}
