import { personRepository } from '../../../data/repositories/PeopleRepository';
import type { Person, UpdatePersonInput } from '../../models/Person';

export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person> {
  return personRepository.update(id, input);
}
