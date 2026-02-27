import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import type { Task, Todo, Reminder } from '../../models/Task';

export async function getTasks(): Promise<Task[]> {
  return taskRepository.getAll();
}

export async function getTodos(): Promise<Todo[]> {
  return todoRepository.getAll();
}

export async function getReminders(): Promise<Reminder[]> {
  return reminderRepository.getAll();
}

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
