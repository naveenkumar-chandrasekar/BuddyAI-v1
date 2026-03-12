import { taskRepository } from '../../../data/repositories/TaskRepository';
import type { Task, CreateTaskInput } from '../../models/Task';

export async function addTask(input: CreateTaskInput): Promise<Task> {
  if (!input.title.trim()) throw new Error('Title is required');
  return taskRepository.create(input);
}
