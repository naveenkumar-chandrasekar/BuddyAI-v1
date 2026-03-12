import { todoItemRepository } from '../../../data/repositories/TodoItemRepository';

export async function deleteTodoItem(id: string): Promise<void> {
  return todoItemRepository.remove(id);
}

export async function deleteTodoItems(todoId: string): Promise<void> {
  return todoItemRepository.removeByTodoId(todoId);
}
