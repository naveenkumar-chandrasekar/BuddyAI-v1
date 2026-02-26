import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class NotificationConfigModel extends Model {
  static table = 'notification_config';

  @field('daily_notif_time') dailyNotifTime!: string;
  @field('daily_notif_enabled') dailyNotifEnabled!: number;
  @field('birthday_notif_enabled') birthdayNotifEnabled!: number;
  @field('task_notif_enabled') taskNotifEnabled!: number;
  @field('reminder_notif_enabled') reminderNotifEnabled!: number;
  @field('missed_notif_enabled') missedNotifEnabled!: number;
  @field('high_priority_days') highPriorityDays!: number;
  @field('medium_priority_days') mediumPriorityDays!: number;
  @field('low_priority_days') lowPriorityDays!: number;
  @field('missed_high_interval') missedHighInterval!: number;
  @field('missed_medium_interval') missedMediumInterval!: number;
  @field('missed_low_interval') missedLowInterval!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}

export class BirthdayReminderModel extends Model {
  static table = 'birthday_reminders';

  @field('person_id') personId!: string;
  @field('birthday_date') birthdayDate!: string;
  @field('remind_on') remindOn!: string;
  @field('days_before') daysBefore!: number;
  @field('is_notified') isNotified!: number;
  @field('is_dismissed') isDismissed!: number;
  @readonly @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;
}
