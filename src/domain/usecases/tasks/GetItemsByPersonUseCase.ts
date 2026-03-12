import { taskRepository } from '../../../data/repositories/TaskRepository';
import { todoRepository } from '../../../data/repositories/TodoRepository';
import { reminderRepository } from '../../../data/repositories/ReminderRepository';
import type { Task } from '../../models/Task';
import type { Todo } from '../../models/Todo';
import type { Reminder } from '../../models/Reminder';

export async function getItemsByPerson(personId: string): Promise<{
  tasks: Task[];
  todos: Todo[];
  reminders: Reminder[];
}> {
  const [tasks, todos, reminders] = await Promise.all([
    taskRepository.getByPersonId(personId),
    todoRepository.getByPersonId(personId),
    reminderRepository.getByPersonId(personId),
  ]);
  return { tasks, todos, reminders };
}
