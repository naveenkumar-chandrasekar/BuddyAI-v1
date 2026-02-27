import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import { peopleRepository } from '../../../data/repositories/PeopleRepository';
import { TaskStatus } from '../../../shared/constants/taskStatus';
import type { Task, Todo, Reminder } from '../../models/Task';
import type { Person } from '../../models/Person';

export interface DailySummary {
  todaysTasks: Task[];
  todaysTodos: Todo[];
  todaysReminders: Reminder[];
  missedItems: { tasks: Task[]; todos: Todo[]; reminders: Reminder[] };
  upcomingBirthdays: { person: Person; daysUntil: number }[];
}

function isSameDay(tsMs: number): boolean {
  const d = new Date(tsMs);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
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

function daysUntilBirthday(birthday: string): number {
  const now = new Date();
  const [, month, day] = birthday.split('-').map(Number);
  const next = new Date(now.getFullYear(), month - 1, day);
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return Math.ceil((next.getTime() - now.getTime()) / 86400000);
}

export async function generateDailySummary(): Promise<DailySummary> {
  const start = todayStart();
  const end = todayEnd();
  const now = Date.now();

  const [allTasks, allTodos, allReminders, allPeople] = await Promise.all([
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
    peopleRepository.getAll(),
  ]);

  const todaysTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end &&
      t.status !== TaskStatus.DONE && t.status !== TaskStatus.DISMISSED,
  );

  const todaysTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate >= start && t.dueDate <= end && !t.isCompleted,
  );

  const todaysReminders = allReminders.filter(
    r => isSameDay(r.remindAt) && !r.isDone,
  );

  const missedTasks = allTasks.filter(
    t => t.dueDate !== null && t.dueDate < start &&
      (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) &&
      !t.isDismissed,
  );

  const missedTodos = allTodos.filter(
    t => t.dueDate !== null && t.dueDate < start && !t.isCompleted && !t.isDismissed,
  );

  const missedReminders = allReminders.filter(
    r => r.remindAt < now && !r.isDone && !r.isDismissed,
  );

  const upcomingBirthdays = allPeople
    .filter(p => p.birthday !== null)
    .map(p => ({ person: p, daysUntil: daysUntilBirthday(p.birthday!) }))
    .filter(x => x.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    todaysTasks,
    todaysTodos,
    todaysReminders,
    missedItems: { tasks: missedTasks, todos: missedTodos, reminders: missedReminders },
    upcomingBirthdays,
  };
}

export function formatDailySummaryBody(summary: DailySummary): string {
  const parts: string[] = [];

  const totalToday =
    summary.todaysTasks.length + summary.todaysTodos.length + summary.todaysReminders.length;
  if (totalToday > 0) {
    parts.push(`${totalToday} item${totalToday !== 1 ? 's' : ''} due today`);
  }

  const totalMissed =
    summary.missedItems.tasks.length +
    summary.missedItems.todos.length +
    summary.missedItems.reminders.length;
  if (totalMissed > 0) {
    parts.push(`${totalMissed} missed item${totalMissed !== 1 ? 's' : ''}`);
  }

  if (summary.upcomingBirthdays.length > 0) {
    const b = summary.upcomingBirthdays[0];
    parts.push(
      b.daysUntil === 0
        ? `🎂 ${b.person.name}'s birthday is today!`
        : `🎂 ${b.person.name}'s birthday in ${b.daysUntil} day${b.daysUntil !== 1 ? 's' : ''}`,
    );
  }

  return parts.length > 0 ? parts.join(' · ') : 'Nothing due today — great job!';
}
