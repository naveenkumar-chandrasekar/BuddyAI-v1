import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

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
  ],
});
