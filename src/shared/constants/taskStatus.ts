export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  MISSED: 'missed',
  DISMISSED: 'dismissed',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskItemType = {
  TASK: 'task',
  TODO: 'todo',
  REMINDER: 'reminder',
} as const;

export type TaskItemTypeValue = (typeof TaskItemType)[keyof typeof TaskItemType];
