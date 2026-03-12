import type { PriorityValue } from '../../shared/constants/priority';

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  priority: PriorityValue;
  personId: string | null;
  relationType: string | null;
  dueDate: number | null;
  isRecurring: boolean;
  recurrence: string | null;
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
  isRecurring?: boolean;
  recurrence?: string;
}

export type UpdateTodoInput = Partial<CreateTodoInput> & {
  isMissed?: boolean;
  missedAt?: number | null;
  nextRemindAt?: number | null;
  remindCount?: number;
  isDismissed?: boolean;
};
