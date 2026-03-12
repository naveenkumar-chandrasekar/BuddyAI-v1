import { reminderRepository } from '../../../data/repositories/ReminderRepository';

export async function deleteReminder(id: string): Promise<void> {
  return reminderRepository.remove(id);
}
