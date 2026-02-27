import { peopleRepository } from '../../../data/repositories/PeopleRepository';
import {
  birthdayReminderRepository,
  notificationConfigRepository,
} from '../../../data/repositories/NotificationRepository';
import { scheduleBirthdayNotification } from '../../../core/notifications/NotifeeService';
import type { Person } from '../../models/Person';
import { Priority } from '../../../shared/constants/priority';
import { DEFAULT_NOTIFICATION_CONFIG } from '../../models/Notification';

function nextBirthdayDate(birthday: string, daysBefore: number): Date | null {
  const parts = birthday.split('-');
  if (parts.length !== 3) return null;
  const [, month, day] = parts.map(Number);
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, month - 1, day - daysBefore);
  if (candidate < now) {
    year += 1;
  }
  const remindOn = new Date(year, month - 1, day - daysBefore);
  return remindOn;
}

function birthdayDateForYear(birthday: string, year: number): string {
  const [, month, day] = birthday.split('-');
  return `${year}-${month}-${day}`;
}

function getLeadDays(person: Person, config: {
  highPriorityDays: number;
  mediumPriorityDays: number;
  lowPriorityDays: number;
}): number {
  if (person.priority === Priority.HIGH) return config.highPriorityDays;
  if (person.priority === Priority.MEDIUM) return config.mediumPriorityDays;
  return config.lowPriorityDays;
}

export async function populateBirthdayReminders(): Promise<void> {
  const [people, config] = await Promise.all([
    peopleRepository.getAll(),
    notificationConfigRepository.get(),
  ]);

  const cfg = config ?? { ...DEFAULT_NOTIFICATION_CONFIG, id: '' };
  if (!cfg.birthdayNotifEnabled) return;

  await birthdayReminderRepository.deleteAll();

  const now = new Date();
  const year = now.getFullYear();

  for (const person of people) {
    if (!person.birthday) continue;

    const db = getLeadDays(person, cfg);
    const remindOnDate = nextBirthdayDate(person.birthday, db);
    if (!remindOnDate) continue;

    const remindOnStr = remindOnDate.toISOString().split('T')[0];
    const bdYear = remindOnDate < now ? year + 1 : year;
    const birthdayDate = birthdayDateForYear(person.birthday, bdYear);

    await birthdayReminderRepository.create({
      personId: person.id,
      birthdayDate,
      remindOn: remindOnStr,
      daysBefore: db,
    });

    await scheduleBirthdayNotification(person.name, person.id, remindOnDate);
  }
}

export async function checkAndScheduleBirthdayReminders(): Promise<void> {
  const pending = await birthdayReminderRepository.getPending();
  const today = new Date().toISOString().split('T')[0];

  for (const reminder of pending) {
    if (reminder.remindOn <= today) {
      const person = await peopleRepository.getById(reminder.personId);
      if (person) {
        const remindOnDate = new Date(reminder.remindOn);
        await scheduleBirthdayNotification(person.name, person.id, remindOnDate);
        await birthdayReminderRepository.markNotified(reminder.id);
      }
    }
  }
}
