import { tableSchema } from '@nozbe/watermelondb';

export const chatSessionsSchema = tableSchema({
  name: 'chat_sessions',
  columns: [
    { name: 'session_date', type: 'string' },
    { name: 'title', type: 'string', isOptional: true },
    { name: 'summary', type: 'string', isOptional: true },
    { name: 'is_daily', type: 'number' },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ],
});

export const chatMessagesSchema = tableSchema({
  name: 'chat_messages',
  columns: [
    { name: 'session_id', type: 'string', isIndexed: true },
    { name: 'sender', type: 'string' },
    { name: 'message', type: 'string' },
    { name: 'message_type', type: 'string' },
    { name: 'action_type', type: 'string', isOptional: true },
    { name: 'action_payload', type: 'string', isOptional: true },
    { name: 'is_processed', type: 'number' },
    { name: 'created_at', type: 'number' },
  ],
});

export const chatSessionPeopleSchema = tableSchema({
  name: 'chat_session_people',
  columns: [
    { name: 'session_id', type: 'string', isIndexed: true },
    { name: 'person_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
});

export const chatSessionTasksSchema = tableSchema({
  name: 'chat_session_tasks',
  columns: [
    { name: 'session_id', type: 'string', isIndexed: true },
    { name: 'task_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
});

export const chatSessionTodosSchema = tableSchema({
  name: 'chat_session_todos',
  columns: [
    { name: 'session_id', type: 'string', isIndexed: true },
    { name: 'todo_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
});

export const chatSessionRemindersSchema = tableSchema({
  name: 'chat_session_reminders',
  columns: [
    { name: 'session_id', type: 'string', isIndexed: true },
    { name: 'reminder_id', type: 'string', isIndexed: true },
    { name: 'created_at', type: 'number' },
  ],
});
