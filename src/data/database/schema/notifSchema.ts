import { tableSchema } from '@nozbe/watermelondb';

export const notificationConfigSchema = tableSchema({
  name: 'notification_config',
  columns: [
    { name: 'daily_notif_time', type: 'string' },
    { name: 'daily_notif_enabled', type: 'number' },
    { name: 'birthday_notif_enabled', type: 'number' },
    { name: 'task_notif_enabled', type: 'number' },
    { name: 'reminder_notif_enabled', type: 'number' },
    { name: 'missed_notif_enabled', type: 'number' },
    { name: 'high_priority_days', type: 'number' },
    { name: 'medium_priority_days', type: 'number' },
    { name: 'low_priority_days', type: 'number' },
    { name: 'missed_high_interval', type: 'number' },
    { name: 'missed_medium_interval', type: 'number' },
    { name: 'missed_low_interval', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
});

export const birthdayRemindersSchema = tableSchema({
  name: 'birthday_reminders',
  columns: [
    { name: 'person_id', type: 'string', isIndexed: true },
    { name: 'birthday_date', type: 'string' },
    { name: 'remind_on', type: 'string' },
    { name: 'days_before', type: 'number' },
    { name: 'is_notified', type: 'number' },
    { name: 'is_dismissed', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
});
