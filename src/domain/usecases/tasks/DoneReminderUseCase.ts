import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import { addReminder } from './AddReminderUseCase';
import { computeNextDueDate } from '../../../core/utils/recurrence';
import type { Reminder } from '../../models/Reminder';

export async function doneReminder(id: string): Promise<{ reminder: Reminder; next?: Reminder }> {
  const reminder = await reminderRepository.getById(id);
  if (!reminder) throw new Error('Reminder not found');

  if (!reminder.isDone && reminder.isRecurring && reminder.recurrence) {
    const nextRemindAt = computeNextDueDate(reminder.recurrence, new Date());
    const next = await addReminder({
      title: reminder.title,
      description: reminder.description ?? undefined,
      remindAt: nextRemindAt,
      isRecurring: true,
      recurrence: reminder.recurrence,
      personId: reminder.personId ?? undefined,
      relationType: reminder.relationType ?? undefined,
      priority: reminder.priority,
      tags: reminder.tags ?? undefined,
    });
    await reminderRepository.remove(id);
    return { reminder, next };
  }

  const updated = await reminderRepository.update(id, { isDone: true });
  return { reminder: updated };
}
