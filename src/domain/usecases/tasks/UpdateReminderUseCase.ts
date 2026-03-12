import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import type { Reminder, UpdateReminderInput } from '../../models/Reminder';

export async function updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder> {
  return reminderRepository.update(id, input);
}
