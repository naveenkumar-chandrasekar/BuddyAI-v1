import { todoItemRepository } from '../../../data/repositories/TodoItemRepository';
import type { TodoItem, UpdateTodoItemInput } from '../../models/TodoItem';

export async function updateTodoItem(id: string, input: UpdateTodoItemInput): Promise<TodoItem> {
  return todoItemRepository.update(id, input);
}

export async function toggleTodoItem(id: string): Promise<TodoItem> {
  return todoItemRepository.toggleComplete(id);
}
