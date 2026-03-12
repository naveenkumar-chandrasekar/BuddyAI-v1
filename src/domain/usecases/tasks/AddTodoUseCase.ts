import { todoRepository } from '../../../data/repositories/TodoRepository';
import type { Todo, CreateTodoInput } from '../../models/Todo';

export async function addTodo(input: CreateTodoInput): Promise<Todo> {
  if (!input.title.trim()) throw new Error('Title is required');
  return todoRepository.create(input);
}
