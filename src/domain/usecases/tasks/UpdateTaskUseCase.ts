import { taskRepository } from '../../../data/repositories/TaskRepository';
import type { Task, UpdateTaskInput } from '../../models/Task';

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return taskRepository.update(id, input);
}
