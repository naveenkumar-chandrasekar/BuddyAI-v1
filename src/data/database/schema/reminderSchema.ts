import { tableSchema } from '@nozbe/watermelondb';

export const remindersSchema = tableSchema({
  name: 'reminders',
  columns: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string', isOptional: true },
    { name: 'remind_at', type: 'number' },
    { name: 'is_recurring', type: 'number' },
    { name: 'recurrence', type: 'string', isOptional: true },
    { name: 'is_done', type: 'number' },
    { name: 'person_id', type: 'string', isOptional: true },
    { name: 'relation_type', type: 'string', isOptional: true },
    { name: 'priority', type: 'number' },
    { name: 'tags', type: 'string', isOptional: true },
    { name: 'snooze_until', type: 'number', isOptional: true },
    { name: 'is_missed', type: 'number' },
    { name: 'missed_at', type: 'number', isOptional: true },
    { name: 'next_remind_at', type: 'number', isOptional: true },
    { name: 'remind_count', type: 'number' },
    { name: 'is_dismissed', type: 'number' },
    { name: 'dismissed_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
