import type { PriorityValue } from '../../shared/constants/priority';

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
