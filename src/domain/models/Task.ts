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
  tags: string | null;
  estimatedMinutes: number | null;
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

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: number;
  dueTime?: number;
  priority: PriorityValue;
  personId?: string;
  relationType?: string;
  tags?: string;
  estimatedMinutes?: number;
  isRecurring?: boolean;
  recurrence?: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatusValue;
  isMissed?: boolean;
  missedAt?: number | null;
  nextRemindAt?: number | null;
  remindCount?: number;
  isDismissed?: boolean;
};
