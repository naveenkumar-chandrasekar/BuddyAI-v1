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
import { todoItemsSchema } from './todoItemSchema';

export const schema = appSchema({
  version: 8,
  tables: [
    placesSchema,
    personsSchema,
    personConnectionsSchema,
    tasksSchema,
    todosSchema,
    todoItemsSchema,
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
