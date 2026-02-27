import { taskRepository, todoRepository, reminderRepository } from '../../data/repositories/TaskRepository';
import { notificationConfigRepository } from '../../data/repositories/NotificationRepository';
import { scheduleMissedItemNotification } from '../notifications/NotifeeService';
import { TaskStatus } from '../../shared/constants/taskStatus';
import { Priority } from '../../shared/constants/priority';
import { DEFAULT_NOTIFICATION_CONFIG } from '../../domain/models/Notification';
import type { Task, Todo, Reminder } from '../../domain/models/Task';

const DAY_MS = 86400000;

function missedIntervalMs(
  priority: number,
  config: { missedHighInterval: number; missedMediumInterval: number; missedLowInterval: number },
): number {
  if (priority === Priority.HIGH) return config.missedHighInterval * DAY_MS;
  if (priority === Priority.MEDIUM) return config.missedMediumInterval * DAY_MS;
  return config.missedLowInterval * DAY_MS;
}

async function getConfig() {
  const config = await notificationConfigRepository.get();
  return config ?? { ...DEFAULT_NOTIFICATION_CONFIG, id: '' };
}

async function processMissedTask(task: Task, intervalMs: number): Promise<void> {
  const now = Date.now();
  const newCount = task.remindCount + 1;
  const nextRemindAt = now + intervalMs;

  await taskRepository.update(task.id, {
    isMissed: true,
    missedAt: task.missedAt ?? now,
    remindCount: newCount,
    nextRemindAt,
    status: TaskStatus.MISSED,
  });

  await scheduleMissedItemNotification('task', task.id, task.title, newCount, nextRemindAt);
}

async function processMissedTodo(todo: Todo, intervalMs: number): Promise<void> {
  const now = Date.now();
  const newCount = todo.remindCount + 1;
  const nextRemindAt = now + intervalMs;

  await todoRepository.update(todo.id, {
    isMissed: true,
    missedAt: todo.missedAt ?? now,
    remindCount: newCount,
    nextRemindAt,
  });

  await scheduleMissedItemNotification('todo', todo.id, todo.title, newCount, nextRemindAt);
}

async function processMissedReminder(reminder: Reminder, intervalMs: number): Promise<void> {
  const now = Date.now();
  const newCount = reminder.remindCount + 1;
  const nextRemindAt = now + intervalMs;

  await reminderRepository.update(reminder.id, {
    isMissed: true,
    missedAt: reminder.missedAt ?? now,
    remindCount: newCount,
    nextRemindAt,
  });

  await scheduleMissedItemNotification('reminder', reminder.id, reminder.title, newCount, nextRemindAt);
}

export async function checkMissedItems(): Promise<void> {
  const config = await getConfig();
  if (!config.missedNotifEnabled) return;

  const now = Date.now();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const startMs = todayStart.getTime();

  const [allTasks, allTodos, allReminders] = await Promise.all([
    taskRepository.getAll(),
    todoRepository.getAll(),
    reminderRepository.getAll(),
  ]);

  const missedTasks = allTasks.filter(
    t =>
      t.dueDate !== null &&
      t.dueDate < startMs &&
      (t.status === TaskStatus.PENDING || t.status === TaskStatus.IN_PROGRESS) &&
      !t.isDismissed &&
      (t.nextRemindAt === null || t.nextRemindAt <= now),
  );

  const missedTodos = allTodos.filter(
    t =>
      t.dueDate !== null &&
      t.dueDate < startMs &&
      !t.isCompleted &&
      !t.isDismissed &&
      (t.nextRemindAt === null || t.nextRemindAt <= now),
  );

  const missedReminders = allReminders.filter(
    r =>
      r.remindAt < now &&
      !r.isDone &&
      !r.isDismissed &&
      (r.nextRemindAt === null || r.nextRemindAt <= now),
  );

  await Promise.all([
    ...missedTasks.map(t => processMissedTask(t, missedIntervalMs(t.priority, config))),
    ...missedTodos.map(t => processMissedTodo(t, missedIntervalMs(t.priority, config))),
    ...missedReminders.map(r => processMissedReminder(r, missedIntervalMs(r.priority, config))),
  ]);
}
