import { taskRepository } from '../../../data/repositories/TaskRepository';

export async function deleteTask(id: string): Promise<void> {
  return taskRepository.remove(id);
}
