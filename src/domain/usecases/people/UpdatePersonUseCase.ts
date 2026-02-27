import { peopleRepository } from '../../../data/repositories/PeopleRepository';
import type { Person, UpdatePersonInput } from '../../models/Person';

export async function updatePerson(id: string, input: UpdatePersonInput): Promise<Person> {
  return peopleRepository.update(id, input);
}
