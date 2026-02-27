import type { PriorityValue } from '../../shared/constants/priority';
import type { TaskStatusValue } from '../../shared/constants/taskStatus';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: number | null;
  dueTime: number | null;
  priority: PriorityValue;
  status: TaskStatusValue;
  personId: string | null;
  relationType: string | null;
  isMissed: boolean;
  missedAt: number | null;
  nextRemindAt: number | null;
  remindCount: number;
  isDismissed: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: number;
  dueTime?: number;
  priority: PriorityValue;
  personId?: string;
  relationType?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatusValue;
  isMissed?: boolean;
  missedAt?: number | null;
  nextRemindAt?: number | null;
  remindCount?: number;
  isDismissed?: boolean;
};

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: PriorityValue;
  personId: string | null;
  relationType: string | null;
  dueDate: number | null;
  isMissed: boolean;
  missedAt: number | null;
  nextRemindAt: number | null;
  remindCount: number;
  isDismissed: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
}

export interface CreateTodoInput {
  title: string;
  priority: PriorityValue;
  personId?: string;
  relationType?: string;
  dueDate?: number;
}

export type UpdateTodoInput = Partial<CreateTodoInput> & {
  isMissed?: boolean;
  missedAt?: number | null;
  nextRemindAt?: number | null;
  remindCount?: number;
  isDismissed?: boolean;
};

export interface Reminder {
  id: string;
  title: string;
  description: string | null;
  remindAt: number;
  isRecurring: boolean;
  recurrence: string | null;
  isDone: boolean;
  personId: string | null;
  relationType: string | null;
  priority: PriorityValue;
  isMissed: boolean;
  missedAt: number | null;
  nextRemindAt: number | null;
  remindCount: number;
  isDismissed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  remindAt: number;
  isRecurring?: boolean;
  recurrence?: string;
  personId?: string;
  relationType?: string;
  priority: PriorityValue;
}

export type UpdateReminderInput = Partial<CreateReminderInput> & {
  isDone?: boolean;
  isMissed?: boolean;
  missedAt?: number | null;
  nextRemindAt?: number | null;
  remindCount?: number;
  isDismissed?: boolean;
};
