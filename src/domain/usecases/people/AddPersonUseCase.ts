import { peopleRepository } from '../../../data/repositories/PeopleRepository';
import type { Person, CreatePersonInput } from '../../models/Person';

export async function addPerson(input: CreatePersonInput): Promise<Person> {
  if (!input.name.trim()) throw new Error('Name is required');
  return peopleRepository.create(input);
}
