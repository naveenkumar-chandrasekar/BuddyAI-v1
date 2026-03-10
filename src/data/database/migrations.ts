import { schemaMigrations, addColumns, createTable } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'todos',
          columns: [
            { name: 'is_recurring', type: 'number' },
            { name: 'recurrence', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'person_connections',
          columns: [
            { name: 'person_id', type: 'string' },
            { name: 'related_person_id', type: 'string' },
            { name: 'label', type: 'string' },
            { name: 'created_at', type: 'number' },
            { name: 'is_deleted', type: 'number' },
          ],
        }),
      ],
    },
  ],
});
