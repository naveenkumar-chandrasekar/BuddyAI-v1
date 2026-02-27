import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import PlaceModel from './models/PlaceModel';
import PersonModel from './models/PersonModel';
import TaskModel from './models/TaskModel';
import TodoModel from './models/TodoModel';
import ReminderModel from './models/ReminderModel';
import {
  ChatSessionModel,
  ChatMessageModel,
  ChatSessionPersonModel,
  ChatSessionTaskModel,
  ChatSessionTodoModel,
  ChatSessionReminderModel,
} from './models/ChatModel';
import {
  NotificationConfigModel,
  BirthdayReminderModel,
} from './models/NotifModel';

const MODEL_CLASSES = [
  PlaceModel,
  PersonModel,
  TaskModel,
  TodoModel,
  ReminderModel,
  ChatSessionModel,
  ChatMessageModel,
  ChatSessionPersonModel,
  ChatSessionTaskModel,
  ChatSessionTodoModel,
  ChatSessionReminderModel,
  NotificationConfigModel,
  BirthdayReminderModel,
];

let _db: Database | null = null;

export function initDatabase(encryptionKey: string): void {
  if (_db) return;
  const adapterOptions: any = {
    schema,
    dbName: 'buddyai',
    jsi: true,
    encryptionKey: encryptionKey || undefined,
    onSetUpError: (error: Error) => {
      console.error('[WatermelonDB] Setup error:', error);
    },
  };
  const adapter = new SQLiteAdapter(adapterOptions);
  _db = new Database({ adapter, modelClasses: MODEL_CLASSES });
}

export function getDb(): Database {
  if (!_db) {
    initDatabase('');
  }
  return _db as Database;
}
