import { taskRepository } from '../../../data/repositories/TaskRepository';
import { addTask } from './AddTaskUseCase';
import { computeNextDueDate } from '../../../core/utils/recurrence';
import { TaskStatus } from '../../../shared/constants/taskStatus';
import type { Task } from '../../models/Task';

export async function completeTask(id: string): Promise<{ task: Task; next?: Task }> {
  const task = await taskRepository.getById(id);
  if (!task) throw new Error('Task not found');

  if (task.status !== TaskStatus.DONE && task.isRecurring && task.recurrence) {
    const nextDue = computeNextDueDate(task.recurrence, new Date());
    const next = await addTask({
      title: task.title,
      description: task.description ?? undefined,
      priority: task.priority,
      personId: task.personId ?? undefined,
      relationType: task.relationType ?? undefined,
      tags: task.tags ?? undefined,
      estimatedMinutes: task.estimatedMinutes ?? undefined,
      isRecurring: true,
      recurrence: task.recurrence,
      dueDate: nextDue,
    });
    await taskRepository.remove(id);
    return { task, next };
  }

  const updated = await taskRepository.update(id, { status: TaskStatus.DONE });
  return { task: updated };
}
