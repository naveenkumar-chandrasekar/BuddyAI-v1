import { peopleRepository } from '../../../data/repositories/PeopleRepository';
import type { Person } from '../../models/Person';

export async function getPeople(): Promise<Person[]> {
  return peopleRepository.getAll();
}

export async function searchPeople(query: string): Promise<Person[]> {
  if (!query.trim()) return peopleRepository.getAll();
  return peopleRepository.search(query);
}

export async function filterPeopleByRelationship(type: string): Promise<Person[]> {
  return peopleRepository.filterByRelationship(type);
}
