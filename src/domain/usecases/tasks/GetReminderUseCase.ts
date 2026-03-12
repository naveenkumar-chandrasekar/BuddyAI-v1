import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import type { Reminder } from '../../models/Reminder';

export async function getReminders(): Promise<Reminder[]> {
  return reminderRepository.getAll();
}

export async function getUpcomingReminders(): Promise<Reminder[]> {
  return reminderRepository.getUpcoming();
}
