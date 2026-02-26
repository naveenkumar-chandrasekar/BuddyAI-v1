import { appSchema } from '@nozbe/watermelondb';
import { placesSchema } from './placesSchema';
import { peopleSchema } from './peopleSchema';
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
  version: 1,
  tables: [
    placesSchema,
    peopleSchema,
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
