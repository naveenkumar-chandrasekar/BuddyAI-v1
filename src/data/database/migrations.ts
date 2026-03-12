import { schemaMigrations, addColumns, createTable, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';

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
    {
      toVersion: 4,
      steps: [
        unsafeExecuteSql('ALTER TABLE people RENAME TO persons;'),
        addColumns({
          table: 'persons',
          columns: [
            { name: 'email', type: 'string', isOptional: true },
            { name: 'last_contacted_at', type: 'number', isOptional: true },
            { name: 'contact_frequency', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'tasks',
          columns: [
            { name: 'tags', type: 'string', isOptional: true },
            { name: 'estimated_minutes', type: 'number', isOptional: true },
            { name: 'is_recurring', type: 'number' },
            { name: 'recurrence', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
