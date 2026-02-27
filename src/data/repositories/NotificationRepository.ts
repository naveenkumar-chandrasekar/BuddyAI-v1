import { Q } from '@nozbe/watermelondb';
import { db } from '../database/database';
import { NotificationConfigModel, BirthdayReminderModel } from '../database/models/NotifModel';
import type {
  NotificationConfig,
  CreateNotificationConfigInput,
  UpdateNotificationConfigInput,
  BirthdayReminder,
} from '../../domain/models/Notification';

function toConfig(m: NotificationConfigModel): NotificationConfig {
  return {
    id: m.id,
    dailyNotifTime: m.dailyNotifTime,
    dailyNotifEnabled: m.dailyNotifEnabled === 1,
    birthdayNotifEnabled: m.birthdayNotifEnabled === 1,
    taskNotifEnabled: m.taskNotifEnabled === 1,
    reminderNotifEnabled: m.reminderNotifEnabled === 1,
    missedNotifEnabled: m.missedNotifEnabled === 1,
    highPriorityDays: m.highPriorityDays,
    mediumPriorityDays: m.mediumPriorityDays,
    lowPriorityDays: m.lowPriorityDays,
    missedHighInterval: m.missedHighInterval,
    missedMediumInterval: m.missedMediumInterval,
    missedLowInterval: m.missedLowInterval,
  };
}

function toBirthdayReminder(m: BirthdayReminderModel): BirthdayReminder {
  return {
    id: m.id,
    personId: m.personId,
    birthdayDate: m.birthdayDate,
    remindOn: m.remindOn,
    daysBefore: m.daysBefore,
    isNotified: m.isNotified === 1,
    isDismissed: m.isDismissed === 1,
  };
}

export class NotificationConfigRepository {
  private collection = db.collections.get<NotificationConfigModel>('notification_config');

  async get(): Promise<NotificationConfig | null> {
    const records = await this.collection.query().fetch();
    return records.length > 0 ? toConfig(records[0]) : null;
  }

  async create(input: CreateNotificationConfigInput): Promise<NotificationConfig> {
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.dailyNotifTime = input.dailyNotifTime;
        r.dailyNotifEnabled = input.dailyNotifEnabled ? 1 : 0;
        r.birthdayNotifEnabled = input.birthdayNotifEnabled ? 1 : 0;
        r.taskNotifEnabled = input.taskNotifEnabled ? 1 : 0;
        r.reminderNotifEnabled = input.reminderNotifEnabled ? 1 : 0;
        r.missedNotifEnabled = input.missedNotifEnabled ? 1 : 0;
        r.highPriorityDays = input.highPriorityDays;
        r.mediumPriorityDays = input.mediumPriorityDays;
        r.lowPriorityDays = input.lowPriorityDays;
        r.missedHighInterval = input.missedHighInterval;
        r.missedMediumInterval = input.missedMediumInterval;
        r.missedLowInterval = input.missedLowInterval;
      }),
    );
    return toConfig(record);
  }

  async update(id: string, input: UpdateNotificationConfigInput): Promise<NotificationConfig> {
    const record = await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.dailyNotifTime !== undefined) m.dailyNotifTime = input.dailyNotifTime;
        if (input.dailyNotifEnabled !== undefined) m.dailyNotifEnabled = input.dailyNotifEnabled ? 1 : 0;
        if (input.birthdayNotifEnabled !== undefined) m.birthdayNotifEnabled = input.birthdayNotifEnabled ? 1 : 0;
        if (input.taskNotifEnabled !== undefined) m.taskNotifEnabled = input.taskNotifEnabled ? 1 : 0;
        if (input.reminderNotifEnabled !== undefined) m.reminderNotifEnabled = input.reminderNotifEnabled ? 1 : 0;
        if (input.missedNotifEnabled !== undefined) m.missedNotifEnabled = input.missedNotifEnabled ? 1 : 0;
        if (input.highPriorityDays !== undefined) m.highPriorityDays = input.highPriorityDays;
        if (input.mediumPriorityDays !== undefined) m.mediumPriorityDays = input.mediumPriorityDays;
        if (input.lowPriorityDays !== undefined) m.lowPriorityDays = input.lowPriorityDays;
        if (input.missedHighInterval !== undefined) m.missedHighInterval = input.missedHighInterval;
        if (input.missedMediumInterval !== undefined) m.missedMediumInterval = input.missedMediumInterval;
        if (input.missedLowInterval !== undefined) m.missedLowInterval = input.missedLowInterval;
      });
      return r;
    });
    return toConfig(record);
  }
}

export class BirthdayReminderRepository {
  private collection = db.collections.get<BirthdayReminderModel>('birthday_reminders');

  async getAll(): Promise<BirthdayReminder[]> {
    const records = await this.collection.query().fetch();
    return records.map(toBirthdayReminder);
  }

  async getByPersonId(personId: string): Promise<BirthdayReminder[]> {
    const records = await this.collection
      .query(Q.where('person_id', personId))
      .fetch();
    return records.map(toBirthdayReminder);
  }

  async getPending(): Promise<BirthdayReminder[]> {
    const records = await this.collection
      .query(Q.where('is_notified', 0), Q.where('is_dismissed', 0))
      .fetch();
    return records.map(toBirthdayReminder);
  }

  async create(input: {
    personId: string;
    birthdayDate: string;
    remindOn: string;
    daysBefore: number;
  }): Promise<BirthdayReminder> {
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.personId = input.personId;
        r.birthdayDate = input.birthdayDate;
        r.remindOn = input.remindOn;
        r.daysBefore = input.daysBefore;
        r.isNotified = 0;
        r.isDismissed = 0;
      }),
    );
    return toBirthdayReminder(record);
  }

  async markNotified(id: string): Promise<void> {
    await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isNotified = 1; });
    });
  }

  async dismiss(id: string): Promise<void> {
    await db.write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => { m.isDismissed = 1; });
    });
  }

  async deleteByPersonId(personId: string): Promise<void> {
    await db.write(async () => {
      const records = await this.collection
        .query(Q.where('person_id', personId))
        .fetch();
      await Promise.all(records.map(r => r.destroyPermanently()));
    });
  }

  async deleteAll(): Promise<void> {
    await db.write(async () => {
      const records = await this.collection.query().fetch();
      await Promise.all(records.map(r => r.destroyPermanently()));
    });
  }
}

export const notificationConfigRepository = new NotificationConfigRepository();
export const birthdayReminderRepository = new BirthdayReminderRepository();
