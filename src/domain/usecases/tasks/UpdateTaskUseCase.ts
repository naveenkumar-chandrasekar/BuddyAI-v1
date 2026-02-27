import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import type { Task, UpdateTaskInput, Todo, Reminder, UpdateReminderInput } from '../../models/Task';

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return taskRepository.update(id, input);
}

export async function toggleTodo(id: string): Promise<Todo> {
  return todoRepository.toggleComplete(id);
}

export async function updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder> {
  return reminderRepository.update(id, input);
}
