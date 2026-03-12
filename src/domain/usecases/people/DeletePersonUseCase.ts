import { personRepository } from '../../../data/repositories/PeopleRepository';

export async function deletePerson(id: string): Promise<void> {
  return personRepository.remove(id);
}
