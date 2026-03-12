import type { PriorityValue } from '../../shared/constants/priority';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: PriorityValue;
  personId: string | null;
  relationType: string | null;
  tags: string | null;
  estimatedMinutes: number | null;
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
  description?: string;
  priority: PriorityValue;
  personId?: string;
  relationType?: string;
  tags?: string;
  estimatedMinutes?: number;
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
