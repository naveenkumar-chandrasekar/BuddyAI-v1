import { taskRepository } from '../../data/repositories/TaskRepository';
import { todoRepository } from '../../data/repositories/TodoRepository';
import { reminderRepository } from '../../data/repositories/ReminderRepository';
import { personRepository } from '../../data/repositories/PeopleRepository';
import { TaskStatus } from '../../shared/constants/taskStatus';
import { storage } from '../storage/mmkv';

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

function upcomingEnd(): number {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export async function buildQueryTodayMessage(): Promise<string> {
  const userName = storage.getString('user_name') ?? 'there';
  const start = todayStart();
  const end = todayEnd();
  const now = Date.now();

  const [allTasks, allTodos, allReminders] = await Promise.all([
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
  ]);

  const tasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED && !t.isDismissed,
  );
  const todos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      !t.isCompleted && !t.isDismissed,
  );
  const reminders = allReminders.filter(
    r => r.remindAt >= start && r.remindAt <= end && !r.isDone && !r.isDismissed,
  );
  const missed = [
    ...allTasks.filter(t => t.dueDate !== null && t.dueDate < start &&
      (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) && !t.isDismissed),
    ...allTodos.filter(t => t.dueDate !== null && t.dueDate < start && !t.isCompleted && !t.isDismissed),
    ...allReminders.filter(r => r.remindAt < now && !r.isDone && !r.isDismissed),
  ];

  const parts: string[] = [`Hi ${userName}!`];

  if (tasks.length === 0 && todos.length === 0 && reminders.length === 0) {
    parts.push("You have nothing scheduled for today. Enjoy your free day!");
  } else {
    if (tasks.length > 0) {
      parts.push(`Tasks (${tasks.length}): ${tasks.map(t => t.title).join(', ')}.`);
    }
    if (todos.length > 0) {
      parts.push(`Todos (${todos.length}): ${todos.map(t => t.title).join(', ')}.`);
    }
    if (reminders.length > 0) {
      parts.push(`Reminders (${reminders.length}): ${reminders.map(r => {
        const time = new Date(r.remindAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return `${r.title} at ${time}`;
      }).join(', ')}.`);
    }
  }

  if (missed.length > 0) {
    parts.push(`You also have ${missed.length} missed item${missed.length > 1 ? 's' : ''} from earlier.`);
  }

  return parts.join(' ');
}

export async function buildQueryUpcomingMessage(): Promise<string> {
  const userName = storage.getString('user_name') ?? 'there';
  const start = todayEnd() + 1;
  const end = upcomingEnd();

  const [allTasks, allTodos, allReminders] = await Promise.all([
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
  ]);

  const tasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED,
  );
  const todos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end && !t.isCompleted,
  );
  const reminders = allReminders.filter(
    r => r.remindAt >= start && r.remindAt <= end && !r.isDone,
  );

  if (tasks.length === 0 && todos.length === 0 && reminders.length === 0) {
    return `Hi ${userName}! Nothing coming up in the next 7 days. You're all clear!`;
  }

  const parts: string[] = [`Hi ${userName}! In the next 7 days:`];

  if (tasks.length > 0) {
    parts.push(`Tasks: ${tasks.map(t => {
      const day = new Date(t.dueDate!).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      return `${t.title} (${day})`;
    }).join(', ')}.`);
  }
  if (todos.length > 0) {
    parts.push(`Todos: ${todos.map(t => t.title).join(', ')}.`);
  }
  if (reminders.length > 0) {
    parts.push(`Reminders: ${reminders.map(r => r.title).join(', ')}.`);
  }

  return parts.join(' ');
}

export async function buildBirthdayMessage(): Promise<string> {
  const userName = storage.getString('user_name') ?? 'there';
  const now = new Date();
  const nowMs = now.getTime();

  const allPeople = await personRepository.getAll();
  const upcoming = allPeople.filter(p => {
    if (!p.birthday) return false;
    const [, m, d] = p.birthday.split('-').map(Number);
    const bd = new Date(now.getFullYear(), m - 1, d);
    const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
    return diff >= 0 && diff <= 30;
  });

  if (upcoming.length === 0) {
    return `Hi ${userName}! No birthdays coming up in the next 30 days.`;
  }

  const list = upcoming.map(p => {
    const [, m, d] = p.birthday!.split('-').map(Number);
    const bd = new Date(now.getFullYear(), m - 1, d);
    const diff = Math.ceil((bd.getTime() - nowMs) / 86400000);
    return diff === 0 ? `${p.name} (TODAY!)` : `${p.name} (in ${diff} days)`;
  }).join(', ');

  return `Hi ${userName}! Upcoming birthdays: ${list}.`;
}
