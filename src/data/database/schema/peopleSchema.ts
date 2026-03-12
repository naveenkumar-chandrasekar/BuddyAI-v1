import { tableSchema } from '@nozbe/watermelondb';

export const personsSchema = tableSchema({
  name: 'persons',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'relationship_type', type: 'string' },
    { name: 'custom_relation', type: 'string', isOptional: true },
    { name: 'priority', type: 'number' },
    { name: 'birthday', type: 'string', isOptional: true },
    { name: 'phone', type: 'string', isOptional: true },
    { name: 'email', type: 'string', isOptional: true },
    { name: 'notes', type: 'string', isOptional: true },
    { name: 'last_contacted_at', type: 'number', isOptional: true },
    { name: 'contact_frequency', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
