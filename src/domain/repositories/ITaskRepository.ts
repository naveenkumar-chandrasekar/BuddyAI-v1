import type { Task, CreateTaskInput, UpdateTaskInput } from '../models/Task';
import type { TaskStatusValue } from '../../shared/constants/taskStatus';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByPersonId(personId: string): Promise<Task[]>;
  getByStatus(status: TaskStatusValue): Promise<Task[]>;
  getOverdue(): Promise<Task[]>;
  getMissed(): Promise<Task[]>;
  search(query: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
}
