import { appSchema } from '@nozbe/watermelondb';
import { placesSchema } from './placesSchema';
import { personsSchema } from './peopleSchema';
import { personConnectionsSchema } from './personConnectionsSchema';
import { tasksSchema, todosSchema, remindersSchema } from './tasksSchema';
import {
  chatSessionsSchema,
  chatMessagesSchema,
  chatSessionPeopleSchema,
  chatSessionTasksSchema,
  chatSessionTodosSchema,
  chatSessionRemindersSchema,
} from './chatSchema';
import { notificationConfigSchema, birthdayRemindersSchema } from './notifSchema';

export const schema = appSchema({
  version: 4,
  tables: [
    placesSchema,
    personsSchema,
    personConnectionsSchema,
    tasksSchema,
    todosSchema,
    remindersSchema,
    chatSessionsSchema,
    chatMessagesSchema,
    chatSessionPeopleSchema,
    chatSessionTasksSchema,
    chatSessionTodosSchema,
    chatSessionRemindersSchema,
    notificationConfigSchema,
    birthdayRemindersSchema,
  ],
});
