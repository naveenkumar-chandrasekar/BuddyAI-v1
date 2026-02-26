import { tableSchema } from '@nozbe/watermelondb';

export const placesSchema = tableSchema({
  name: 'places',
  columns: [
    { name: 'name', type: 'string' },
    { name: 'type', type: 'string' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'is_deleted', type: 'number' },
  ],
});
