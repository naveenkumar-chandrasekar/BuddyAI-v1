import { tableSchema } from '@nozbe/watermelondb';

export const peopleSchema = tableSchema({
  name: 'people',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'relationship_type', type: 'string' },
    { name: 'custom_relation', type: 'string', isOptional: true },
    { name: 'place_id', type: 'string', isOptional: true },
    { name: 'priority', type: 'number' },
    { name: 'birthday', type: 'string', isOptional: true },
    { name: 'phone', type: 'string', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
