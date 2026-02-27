import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';

export async function deleteTask(id: string): Promise<void> {
  return taskRepository.remove(id);
}

export async function deleteTodo(id: string): Promise<void> {
  return todoRepository.remove(id);
}

export async function deleteReminder(id: string): Promise<void> {
  return reminderRepository.remove(id);
}
