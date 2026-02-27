import type {
  Task, CreateTaskInput, UpdateTaskInput,
  Todo, CreateTodoInput, UpdateTodoInput,
  Reminder, CreateReminderInput, UpdateReminderInput,
} from '../models/Task';

export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  getByPersonId(personId: string): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: UpdateTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
}

export interface ITodoRepository {
  getAll(): Promise<Todo[]>;
  getById(id: string): Promise<Todo | null>;
  getByPersonId(personId: string): Promise<Todo[]>;
  create(input: CreateTodoInput): Promise<Todo>;
  update(id: string, input: UpdateTodoInput): Promise<Todo>;
  toggleComplete(id: string): Promise<Todo>;
  remove(id: string): Promise<void>;
}

export interface IReminderRepository {
  getAll(): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | null>;
  getByPersonId(personId: string): Promise<Reminder[]>;
  getUpcoming(): Promise<Reminder[]>;
  create(input: CreateReminderInput): Promise<Reminder>;
  update(id: string, input: UpdateReminderInput): Promise<Reminder>;
  remove(id: string): Promise<void>;
}
