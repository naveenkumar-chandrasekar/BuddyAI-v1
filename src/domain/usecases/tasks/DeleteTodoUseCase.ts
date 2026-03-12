import { todoRepository } from '../../../data/repositories/TodoRepository';

export async function deleteTodo(id: string): Promise<void> {
  return todoRepository.remove(id);
}
