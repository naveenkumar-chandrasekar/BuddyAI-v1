import type { Reminder, CreateReminderInput, UpdateReminderInput } from '../models/Reminder';

export interface IReminderRepository {
  getAll(): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | null>;
  getByPersonId(personId: string): Promise<Reminder[]>;
  getUpcoming(): Promise<Reminder[]>;
  create(input: CreateReminderInput): Promise<Reminder>;
  update(id: string, input: UpdateReminderInput): Promise<Reminder>;
  remove(id: string): Promise<void>;
}
