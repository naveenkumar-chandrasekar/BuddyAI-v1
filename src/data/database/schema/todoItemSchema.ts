import { tableSchema } from '@nozbe/watermelondb';

export const todoItemsSchema = tableSchema({
  name: 'todo_items',
  columns: [
    { name: 'todo_id', type: 'string', isIndexed: true },
    { name: 'title', type: 'string' },
    { name: 'is_completed', type: 'number' },
    { name: 'position', type: 'number' },
    { name: 'person_id', type: 'string', isOptional: true },
    { name: 'relation_type', type: 'string', isOptional: true },
    { name: 'completed_at', type: 'number', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
