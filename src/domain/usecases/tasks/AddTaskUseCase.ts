import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import type { Task, CreateTaskInput, Todo, CreateTodoInput, Reminder, CreateReminderInput } from '../../models/Task';

export async function addTask(input: CreateTaskInput): Promise<Task> {
  if (!input.title.trim()) throw new Error('Title is required');
  return taskRepository.create(input);
}

export async function addTodo(input: CreateTodoInput): Promise<Todo> {
  if (!input.title.trim()) throw new Error('Title is required');
  return todoRepository.create(input);
}

export async function addReminder(input: CreateReminderInput): Promise<Reminder> {
  if (!input.title.trim()) throw new Error('Title is required');
  if (!input.remindAt) throw new Error('Remind time is required');
  return reminderRepository.create(input);
}
