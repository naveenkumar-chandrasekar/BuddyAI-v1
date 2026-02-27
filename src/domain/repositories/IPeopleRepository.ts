import type { Person, CreatePersonInput, UpdatePersonInput } from '../models/Person';

export interface IPeopleRepository {
  getAll(): Promise<Person[]>;
  getById(id: string): Promise<Person | null>;
  search(query: string): Promise<Person[]>;
  filterByRelationship(type: string): Promise<Person[]>;
  create(input: CreatePersonInput): Promise<Person>;
  update(id: string, input: UpdatePersonInput): Promise<Person>;
  remove(id: string): Promise<void>;
}
