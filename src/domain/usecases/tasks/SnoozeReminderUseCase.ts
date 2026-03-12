import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import type { Reminder } from '../../models/Reminder';

export async function snoozeReminder(id: string, snoozeMs: number): Promise<Reminder> {
  const reminder = await reminderRepository.getById(id);
  if (!reminder) throw new Error('Reminder not found');
  if (snoozeMs <= 0) throw new Error('Snooze duration must be positive');
  const snoozeUntil = Date.now() + snoozeMs;
  return reminderRepository.update(id, {
    remindAt: snoozeUntil,
    snoozeUntil,
  });
}
