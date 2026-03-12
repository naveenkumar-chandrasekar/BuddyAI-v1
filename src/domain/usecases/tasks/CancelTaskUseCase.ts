import { taskRepository } from '../../../data/repositories/TaskRepository';
import { TaskStatus } from '../../../shared/constants/taskStatus';
import type { Task } from '../../models/Task';

export async function cancelTask(id: string): Promise<Task> {
  const task = await taskRepository.getById(id);
  if (!task) throw new Error('Task not found');
  return taskRepository.update(id, { status: TaskStatus.CANCELLED });
}
