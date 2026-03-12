import { todoRepository } from '../../../data/repositories/TodoRepository';
import { addTodo } from './AddTodoUseCase';
import { computeNextDueDate } from '../../../core/utils/recurrence';
import type { Todo } from '../../models/Todo';

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
