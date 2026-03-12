import { todoItemRepository } from '../../../data/repositories/TodoItemRepository';
import type { TodoItem, CreateTodoItemInput } from '../../models/TodoItem';

export async function addTodoItem(input: CreateTodoItemInput): Promise<TodoItem> {
  if (!input.title.trim()) throw new Error('Title is required');
  return todoItemRepository.create(input);
}
