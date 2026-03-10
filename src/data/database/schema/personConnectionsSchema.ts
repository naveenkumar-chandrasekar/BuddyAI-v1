import { tableSchema } from '@nozbe/watermelondb';

export const personConnectionsSchema = tableSchema({
  name: 'person_connections',
  columns: [
    { name: 'person_id', type: 'string' },
    { name: 'related_person_id', type: 'string' },
    { name: 'label', type: 'string' },
    { name: 'created_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
