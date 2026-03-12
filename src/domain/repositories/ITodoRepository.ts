import type { Todo, CreateTodoInput, UpdateTodoInput } from '../models/Todo';

export interface ITodoRepository {
  getAll(): Promise<Todo[]>;
  getById(id: string): Promise<Todo | null>;
  getByPersonId(personId: string): Promise<Todo[]>;
  create(input: CreateTodoInput): Promise<Todo>;
  update(id: string, input: UpdateTodoInput): Promise<Todo>;
  toggleComplete(id: string): Promise<Todo>;
  remove(id: string): Promise<void>;
}
