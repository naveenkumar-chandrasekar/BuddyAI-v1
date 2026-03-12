import type { Task, CreateTaskInput, UpdateTaskInput } from '../models/Task';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByPersonId(personId: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
}
