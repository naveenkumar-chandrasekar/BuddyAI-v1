import { appSchema } from '@nozbe/watermelondb';
import { placesSchema } from './placesSchema';
import { personsSchema } from './peopleSchema';
import { personConnectionsSchema } from './personConnectionsSchema';
import { tasksSchema } from './tasksSchema';
import { todosSchema } from './todoSchema';
import { remindersSchema } from './reminderSchema';
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
