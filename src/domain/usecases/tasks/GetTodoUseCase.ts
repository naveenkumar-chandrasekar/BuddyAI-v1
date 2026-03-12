import { todoRepository } from '../../../data/repositories/TodoRepository';
import type { Todo } from '../../models/Todo';

export async function getTodos(): Promise<Todo[]> {
  return todoRepository.getAll();
}
