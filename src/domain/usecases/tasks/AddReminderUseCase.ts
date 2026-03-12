import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import type { Reminder, CreateReminderInput } from '../../models/Reminder';

export async function addReminder(input: CreateReminderInput): Promise<Reminder> {
  if (!input.title.trim()) throw new Error('Title is required');
  if (!input.remindAt) throw new Error('Remind time is required');
  return reminderRepository.create(input);
}
