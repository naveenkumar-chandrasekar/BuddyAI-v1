import type { TodoItem, CreateTodoItemInput, UpdateTodoItemInput } from '../models/TodoItem';

export interface ITodoItemRepository {
  getByTodoId(todoId: string): Promise<TodoItem[]>;
  getById(id: string): Promise<TodoItem | null>;
  create(input: CreateTodoItemInput): Promise<TodoItem>;
  update(id: string, input: UpdateTodoItemInput): Promise<TodoItem>;
  toggleComplete(id: string): Promise<TodoItem>;
  remove(id: string): Promise<void>;
  removeByTodoId(todoId: string): Promise<void>;
}
