import { taskRepository, todoRepository, reminderRepository } from '../../data/repositories/TaskRepository';
import { peopleRepository } from '../../data/repositories/PeopleRepository';
import { chatMessageRepository } from '../../data/repositories/ChatRepository';
import { TaskStatus } from '../../shared/constants/taskStatus';
import { PRIORITY_LABELS } from '../../shared/constants/priority';
import { storage } from '../storage/mmkv';

const SYSTEM_PROMPT = `You are BuddyAi, a personal assistant. Reply ONLY in valid JSON — no other text.
{"intent":"INTENT","action":"ACTION","message":"friendly reply to user","data":{}}

Actions:
TASK_INTENT: CREATE_TASK, COMPLETE_TASK, DELETE_TASK
TODO_INTENT: CREATE_TODO, COMPLETE_TODO, DELETE_TODO
REMINDER_INTENT: CREATE_REMINDER, DELETE_REMINDER
PEOPLE_INTENT: CREATE_PERSON, UPDATE_PERSON, LIST_PEOPLE
QUERY_INTENT: QUERY_TODAY, QUERY_UPCOMING
CONVERSATION_INTENT: GENERAL_CHAT

Rules:
- data fields: title, due_date(unix ms), remind_at(unix ms), id, person_id, priority(1=high 2=med 3=low)
- For QUERY_TODAY and QUERY_UPCOMING: list items from context in the message field.
- For CREATE actions: confirm what was created in the message.
- Use the user's name in replies when appropriate.

Examples:
[Context] Name: Alex, Today tasks: Buy milk[id:t1][Medium], Call dentist[id:t2][High], Today reminders: none
[User] what do I have today
{"intent":"QUERY_INTENT","action":"QUERY_TODAY","message":"Hi Alex! Today you have 2 tasks: Buy milk and Call dentist (high priority). No reminders today.","data":{}}

[Context] Name: Alex, Today tasks: none, Today reminders: none
[User] add buy milk as a task
{"intent":"TASK_INTENT","action":"CREATE_TASK","message":"Done! Added 'buy milk' to your tasks.","data":{"title":"buy milk"}}

[Context] Name: Alex, Today tasks: none
[User] hi
{"intent":"CONVERSATION_INTENT","action":"GENERAL_CHAT","message":"Hello Alex! How can I help you today?","data":{}}

[Context] Name: Alex, Today tasks: none
[User] remind me to call mom at 6pm
{"intent":"REMINDER_INTENT","action":"CREATE_REMINDER","message":"Reminder set! I'll remind you to call mom at 6 PM.","data":{"title":"call mom"}}

[Context] Name: Alex, People: none
[User] add sarah as my colleague
{"intent":"PEOPLE_INTENT","action":"CREATE_PERSON","message":"Added Sarah as a colleague!","data":{"name":"sarah","relationship_type":"colleague"}}`;

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
    chatMessageRepository.getRecentBySessionId(sessionId, 5),
  ]);

  const peopleSummary = allPeople.length === 0
    ? 'none'
    : allPeople.slice(0, 5).map(p => `${p.name}[id:${p.id}](${p.relationshipType})`).join(', ');

  const todayTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED,
  ).slice(0, 5);
  const tasksSummary = todayTasks.length === 0
    ? 'none'
    : todayTasks.map(t => `${t.title}[id:${t.id}][${PRIORITY_LABELS[t.priority]}]${t.personId ? `[person_id:${t.personId}]` : ''}`).join(', ');

  const todayTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end && !t.isCompleted,
  ).slice(0, 5);
  const todosSummary = todayTodos.length === 0
    ? 'none'
    : todayTodos.map(t => `${t.title}[id:${t.id}]${t.personId ? `[person_id:${t.personId}]` : ''}`).join(', ');

  const todayReminders = allReminders.filter(
    r => r.remindAt >= start && r.remindAt <= end && !r.isDone,
  ).slice(0, 5);
  const remindersSummary = todayReminders.length === 0
    ? 'none'
    : todayReminders.map(r => `${r.title}[id:${r.id}]@${new Date(r.remindAt).toLocaleTimeString()}`).join(', ');

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
  const allMissed = [
    ...missedTasks.map(t => `${t.title}[type:task,id:${t.id}]`),
    ...missedTodos.map(t => `${t.title}[type:todo,id:${t.id}]`),
    ...missedReminders.map(r => `${r.title}[type:reminder,id:${r.id}]`),
  ].slice(0, 5);
  const missedSummary = allMissed.length === 0 ? 'none' : allMissed.join(', ');

  const birthdayPeople = allPeople.filter(p => {
    if (!p.birthday) return false;
    const [, m, d] = p.birthday.split('-').map(Number);
    const bd = new Date(now.getFullYear(), m - 1, d);
    const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
    return diff >= 0 && diff <= 14;
  });
  const birthdaysSummary = birthdayPeople.length === 0
    ? 'none'
    : birthdayPeople.map(p => {
        const [, m, d] = p.birthday!.split('-').map(Number);
        const bd = new Date(now.getFullYear(), m - 1, d);
        const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
        return `${p.name}:${diff === 0 ? 'TODAY' : `in ${diff}d`}`;
      }).join(', ');

  const chatHistory = recentMessages.length === 0
    ? ''
    : recentMessages
        .map(msg => `${msg.sender === 'user' ? userName : 'AI'}: ${msg.message}`)
        .join('\n');

  const context = `[Context]
Date: ${dateStr} ${timeStr}
Name: ${userName}
People: ${peopleSummary}
Today tasks: ${tasksSummary}
Today todos: ${todosSummary}
Today reminders: ${remindersSummary}
Missed: ${missedSummary}
Birthdays: ${birthdaysSummary}${chatHistory ? `\nHistory:\n${chatHistory}` : ''}
[User] ${userMessage}`;

  return `<|im_start|>system
${SYSTEM_PROMPT}<|im_end|>
<|im_start|>user
${context}<|im_end|>
<|im_start|>assistant
{"intent":"`;
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
