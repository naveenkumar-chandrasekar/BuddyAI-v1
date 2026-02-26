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

const adapter = new SQLiteAdapter({
  schema,
  dbName: 'buddyai',
  jsi: true,
  onSetUpError: error => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

export const db = new Database({
  adapter,
  modelClasses: [
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
  ],
});
