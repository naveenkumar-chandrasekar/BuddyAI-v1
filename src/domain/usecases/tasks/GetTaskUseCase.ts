import { taskRepository } from '../../../data/repositories/TaskRepository';
import type { Task } from '../../models/Task';

export async function getTasks(): Promise<Task[]> {
  return taskRepository.getAll();
}
