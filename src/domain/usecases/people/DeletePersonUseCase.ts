import { peopleRepository } from '../../../data/repositories/PeopleRepository';

export async function deletePerson(id: string): Promise<void> {
  return peopleRepository.remove(id);
}
