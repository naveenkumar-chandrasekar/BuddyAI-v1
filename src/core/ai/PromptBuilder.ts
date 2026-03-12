import { taskRepository } from '../../data/repositories/TaskRepository';
import { todoRepository } from '../../data/repositories/TodoRepository';
import { reminderRepository } from '../../data/repositories/ReminderRepository';
import { personRepository } from '../../data/repositories/PeopleRepository';
import { chatMessageRepository } from '../../data/repositories/ChatRepository';
import { TaskStatus } from '../../shared/constants/taskStatus';
import { PRIORITY_LABELS } from '../../shared/constants/priority';
import { storage } from '../storage/mmkv';

const SYSTEM_PROMPT = `You are BuddyAi. Reply ONLY in valid JSON, no other text.
{"intent":"INTENT","action":"ACTION","message":"short friendly reply","data":{}}

Actions:
TASK_INTENT: CREATE_TASK, COMPLETE_TASK, DELETE_TASK
TODO_INTENT: CREATE_TODO, COMPLETE_TODO, DELETE_TODO
REMINDER_INTENT: CREATE_REMINDER, DELETE_REMINDER
PEOPLE_INTENT: CREATE_PERSON, UPDATE_PERSON, DELETE_PERSON, CREATE_CONNECTION
QUERY_INTENT: QUERY_TODAY, QUERY_UPCOMING, QUERY_BIRTHDAYS
CONVERSATION_INTENT: GENERAL_CHAT

Rules:
- NEVER output due_date or remind_at — the app parses dates itself
- For CREATE_TASK and CREATE_TODO: output only title and priority
- For CREATE_REMINDER: output only title and priority
- For CREATE_PERSON: output name and relationship_type (family|friend|work|school|other|custom)
- For CREATE_CONNECTION: output person1_name, person2_name, label
- For COMPLETE_TASK/COMPLETE_TODO/DELETE_*/UPDATE_*: output both id from context AND title/name so the app can find the item even if id is wrong
- priority: 1=high 2=medium 3=low (default 2)

Examples:
[User] what do I have today
{"intent":"QUERY_INTENT","action":"QUERY_TODAY","message":"Let me check your schedule!","data":{}}
[User] what's coming up
{"intent":"QUERY_INTENT","action":"QUERY_UPCOMING","message":"Here's what's coming up!","data":{}}
[User] upcoming birthdays
{"intent":"QUERY_INTENT","action":"QUERY_BIRTHDAYS","message":"Here are upcoming birthdays!","data":{}}
[User] add buy milk task
{"intent":"TASK_INTENT","action":"CREATE_TASK","message":"Added 'buy milk' to your tasks!","data":{"title":"buy milk","priority":2}}
[User] add urgent task submit report
{"intent":"TASK_INTENT","action":"CREATE_TASK","message":"Added 'submit report' as high priority!","data":{"title":"submit report","priority":1}}
[User] add todo read book
{"intent":"TODO_INTENT","action":"CREATE_TODO","message":"Added 'read book' to your todos!","data":{"title":"read book","priority":2}}
[User] remind me to call mom
{"intent":"REMINDER_INTENT","action":"CREATE_REMINDER","message":"I'll remind you to call mom!","data":{"title":"call mom","priority":2}}
[User] remind me to take medicine
{"intent":"REMINDER_INTENT","action":"CREATE_REMINDER","message":"I'll remind you to take medicine!","data":{"title":"take medicine","priority":2}}
[User] add john to family
{"intent":"PEOPLE_INTENT","action":"CREATE_PERSON","message":"Added John!","data":{"name":"john","relationship_type":"family"}}
[User] add sarah as a colleague
{"intent":"PEOPLE_INTENT","action":"CREATE_PERSON","message":"Added Sarah!","data":{"name":"sarah","relationship_type":"office"}}
[User] add mike
{"intent":"PEOPLE_INTENT","action":"CREATE_PERSON","message":"Added Mike!","data":{"name":"mike","relationship_type":"other"}}
[User] relate john and sarah as siblings
{"intent":"PEOPLE_INTENT","action":"CREATE_CONNECTION","message":"Connected John and Sarah!","data":{"person1_name":"john","person2_name":"sarah","label":"siblings"}}
[User] connect mike and alice as cousins
{"intent":"PEOPLE_INTENT","action":"CREATE_CONNECTION","message":"Connected Mike and Alice!","data":{"person1_name":"mike","person2_name":"alice","label":"cousins"}}
[User] mark buy milk as done
{"intent":"TASK_INTENT","action":"COMPLETE_TASK","message":"Marked buy milk as done!","data":{"id":"ID_FROM_CONTEXT","title":"buy milk"}}
[User] complete read book todo
{"intent":"TODO_INTENT","action":"COMPLETE_TODO","message":"Completed read book!","data":{"id":"ID_FROM_CONTEXT","title":"read book"}}
[User] delete buy milk task
{"intent":"TASK_INTENT","action":"DELETE_TASK","message":"Deleted buy milk!","data":{"id":"ID_FROM_CONTEXT","title":"buy milk"}}
[User] delete call mom reminder
{"intent":"REMINDER_INTENT","action":"DELETE_REMINDER","message":"Deleted reminder!","data":{"id":"ID_FROM_CONTEXT","title":"call mom"}}
[User] delete john from people
{"intent":"PEOPLE_INTENT","action":"DELETE_PERSON","message":"Deleted John!","data":{"id":"ID_FROM_CONTEXT","name":"john"}}
[User] update john's phone to 555-0100
{"intent":"PEOPLE_INTENT","action":"UPDATE_PERSON","message":"Updated John's phone!","data":{"id":"ID_FROM_CONTEXT","name":"john","phone":"555-0100"}}
[User] hi
{"intent":"CONVERSATION_INTENT","action":"GENERAL_CHAT","message":"Hello! How can I help you today?","data":{}}
[User] what can you do
{"intent":"CONVERSATION_INTENT","action":"GENERAL_CHAT","message":"I can manage your tasks, todos, reminders, and people. Just ask!","data":{}}`;

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
    personRepository.getAll(),
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
    personRepository.getAll(),
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
