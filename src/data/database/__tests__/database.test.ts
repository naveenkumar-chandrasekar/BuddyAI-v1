import { db } from '../database';

describe('Database singleton', () => {
  it('is defined', () => {
    expect(db).toBeDefined();
  });

  it('exposes a collections accessor', () => {
    expect(db.collections).toBeDefined();
  });

  it('has a collection for every entity table', () => {
    const expectedTables = [
      'places',
      'people',
      'tasks',
      'todos',
      'reminders',
      'chat_sessions',
      'chat_messages',
      'chat_session_people',
      'chat_session_tasks',
      'chat_session_todos',
      'chat_session_reminders',
      'notification_config',
      'birthday_reminders',
    ];

    for (const table of expectedTables) {
      expect(() => db.collections.get(table)).not.toThrow();
    }
  });
});
