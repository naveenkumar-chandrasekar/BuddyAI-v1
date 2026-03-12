import { tableSchema } from '@nozbe/watermelondb';

export const tasksSchema = tableSchema({
  name: 'tasks',
  columns: [
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string', isOptional: true },
    { name: 'due_date', type: 'number', isOptional: true },
    { name: 'due_time', type: 'number', isOptional: true },
    { name: 'priority', type: 'number' },
    { name: 'status', type: 'string' },
    { name: 'person_id', type: 'string', isOptional: true },
    { name: 'relation_type', type: 'string', isOptional: true },
    { name: 'tags', type: 'string', isOptional: true },
    { name: 'estimated_minutes', type: 'number', isOptional: true },
    { name: 'is_recurring', type: 'number' },
    { name: 'recurrence', type: 'string', isOptional: true },
    { name: 'is_missed', type: 'number' },
    { name: 'missed_at', type: 'number', isOptional: true },
    { name: 'next_remind_at', type: 'number', isOptional: true },
    { name: 'remind_count', type: 'number' },
    { name: 'is_dismissed', type: 'number' },
    { name: 'dismissed_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'completed_at', type: 'number', isOptional: true },
    { name: 'is_deleted', type: 'number' },
  ],
});
