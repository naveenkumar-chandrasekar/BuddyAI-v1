import { taskRepository, todoRepository, reminderRepository } from '../../../data/repositories/TaskRepository';
import { addTodo } from './AddTaskUseCase';
import { computeNextDueDate } from '../../../core/utils/recurrence';
import type { Task, UpdateTaskInput, Todo, Reminder, UpdateReminderInput } from '../../models/Task';

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  return taskRepository.update(id, input);
}

export async function toggleTodo(id: string): Promise<{ todo: Todo; next?: Todo }> {
  const todo = await todoRepository.getById(id);
  if (!todo) throw new Error('Todo not found');

  if (!todo.isCompleted && todo.isRecurring && todo.recurrence) {
    const nextDue = computeNextDueDate(todo.recurrence, new Date());
    const next = await addTodo({
      title: todo.title,
      priority: todo.priority,
      personId: todo.personId ?? undefined,
      relationType: todo.relationType ?? undefined,
      dueDate: nextDue,
      isRecurring: true,
      recurrence: todo.recurrence,
    });
    await todoRepository.remove(id);
    return { todo, next };
  }

  const updated = await todoRepository.toggleComplete(id);
  return { todo: updated };
}

export async function updateReminder(id: string, input: UpdateReminderInput): Promise<Reminder> {
  return reminderRepository.update(id, input);
}
