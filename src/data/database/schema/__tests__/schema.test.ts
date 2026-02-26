import { schema } from '../index';

// schema.tables is an object keyed by table name, not an array
const tableNames = Object.keys(schema.tables);
const getTable = (name: string) => schema.tables[name as keyof typeof schema.tables];

const EXPECTED_TABLES = [
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

describe('Database Schema', () => {
  it('defines exactly 13 tables', () => {
    expect(tableNames).toHaveLength(13);
  });

  it('has schema version 1', () => {
    expect(schema.version).toBe(1);
  });

  it.each(EXPECTED_TABLES)('includes table: %s', tableName => {
    expect(tableNames).toContain(tableName);
  });

  describe('places table', () => {
    const cols = getTable('places').columns;

    it.each(['name', 'type', 'created_at', 'updated_at', 'is_deleted'])(
      'has column: %s',
      col => expect(cols[col]).toBeDefined(),
    );
  });

  describe('people table', () => {
    const cols = getTable('people').columns;

    it.each([
      'name', 'relationship_type', 'custom_relation', 'place_id', 'priority',
      'birthday', 'phone', 'notes', 'created_at', 'updated_at', 'is_deleted',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());

    it('marks nullable fields as optional', () => {
      expect(cols['custom_relation'].isOptional).toBe(true);
      expect(cols['place_id'].isOptional).toBe(true);
      expect(cols['birthday'].isOptional).toBe(true);
      expect(cols['phone'].isOptional).toBe(true);
      expect(cols['notes'].isOptional).toBe(true);
    });
  });

  describe('tasks table', () => {
    const cols = getTable('tasks').columns;

    it.each([
      'title', 'description', 'due_date', 'due_time', 'priority', 'status',
      'person_id', 'relation_type', 'is_missed', 'missed_at', 'next_remind_at',
      'remind_count', 'is_dismissed', 'dismissed_at', 'created_at', 'updated_at',
      'completed_at', 'is_deleted',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());
  });

  describe('todos table', () => {
    const cols = getTable('todos').columns;

    it.each([
      'title', 'is_completed', 'priority', 'person_id', 'relation_type',
      'due_date', 'is_missed', 'missed_at', 'next_remind_at', 'remind_count',
      'is_dismissed', 'dismissed_at', 'created_at', 'updated_at', 'completed_at', 'is_deleted',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());
  });

  describe('reminders table', () => {
    const cols = getTable('reminders').columns;

    it.each([
      'title', 'description', 'remind_at', 'is_recurring', 'recurrence',
      'is_done', 'person_id', 'relation_type', 'priority', 'is_missed',
      'missed_at', 'next_remind_at', 'remind_count', 'is_dismissed',
      'dismissed_at', 'created_at', 'updated_at', 'is_deleted',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());
  });

  describe('chat_sessions table', () => {
    const cols = getTable('chat_sessions').columns;

    it.each(['session_date', 'title', 'summary', 'is_daily', 'created_at', 'updated_at'])(
      'has column: %s',
      col => expect(cols[col]).toBeDefined(),
    );
  });

  describe('chat_messages table', () => {
    const cols = getTable('chat_messages').columns;

    it.each([
      'session_id', 'sender', 'message', 'message_type',
      'action_type', 'action_payload', 'is_processed', 'created_at',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());

    it('indexes session_id', () => {
      expect(cols['session_id'].isIndexed).toBe(true);
    });
  });

  describe('notification_config table', () => {
    const cols = getTable('notification_config').columns;

    it.each([
      'daily_notif_time', 'daily_notif_enabled', 'birthday_notif_enabled',
      'task_notif_enabled', 'reminder_notif_enabled', 'missed_notif_enabled',
      'high_priority_days', 'medium_priority_days', 'low_priority_days',
      'missed_high_interval', 'missed_medium_interval', 'missed_low_interval',
      'created_at', 'updated_at',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());
  });

  describe('birthday_reminders table', () => {
    const cols = getTable('birthday_reminders').columns;

    it.each([
      'person_id', 'birthday_date', 'remind_on', 'days_before',
      'is_notified', 'is_dismissed', 'created_at', 'updated_at',
    ])('has column: %s', col => expect(cols[col]).toBeDefined());

    it('indexes person_id', () => {
      expect(cols['person_id'].isIndexed).toBe(true);
    });
  });
});
