import { todoItemRepository } from '../../../data/repositories/TodoItemRepository';
import type { TodoItem } from '../../models/TodoItem';

export async function getTodoItems(todoId: string): Promise<TodoItem[]> {
  return todoItemRepository.getByTodoId(todoId);
}
