import { personRepository } from '../../../data/repositories/PeopleRepository';
import type { Person } from '../../models/Person';

export async function getPeople(): Promise<Person[]> {
  return personRepository.getAll();
}

export async function searchPeople(query: string): Promise<Person[]> {
  if (!query.trim()) return personRepository.getAll();
  return personRepository.search(query);
}

export async function filterPeopleByRelationship(type: string): Promise<Person[]> {
  return personRepository.filterByRelationship(type);
}
