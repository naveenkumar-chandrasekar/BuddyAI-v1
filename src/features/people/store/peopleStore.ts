import { create } from 'zustand';
import type { Person, CreatePersonInput, UpdatePersonInput } from '../../../domain/models/Person';
import type { Place, CreatePlaceInput } from '../../../domain/models/Place';
import { getPeople, searchPeople, filterPeopleByRelationship } from '../../../domain/usecases/people/GetPeopleUseCase';
import { addPerson } from '../../../domain/usecases/people/AddPersonUseCase';
import { updatePerson } from '../../../domain/usecases/people/UpdatePersonUseCase';
import { deletePerson } from '../../../domain/usecases/people/DeletePersonUseCase';
import { placesRepository } from '../../../data/repositories/PlacesRepository';

interface PeopleState {
  people: Person[];
  places: Place[];
  loading: boolean;
  error: string | null;

  loadPeople(): Promise<void>;
  loadPlaces(): Promise<void>;
  searchPeople(query: string): Promise<void>;
  filterByRelationship(type: string | null): Promise<void>;
  addPerson(input: CreatePersonInput): Promise<Person>;
  updatePerson(id: string, input: UpdatePersonInput): Promise<Person>;
  deletePerson(id: string): Promise<void>;
  addPlace(input: CreatePlaceInput): Promise<Place>;
}

export const usePeopleStore = create<PeopleState>((set, _get) => ({
  people: [],
  places: [],
  loading: false,
  error: null,

  async loadPeople() {
    set({ loading: true, error: null });
    try {
      const people = await getPeople();
      set({ people, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  async loadPlaces() {
    try {
      const places = await placesRepository.getAll();
      set({ places });
    } catch (e) {
      set({ error: String(e) });
    }
  },

  async searchPeople(query) {
    set({ loading: true, error: null });
    try {
      const people = await searchPeople(query);
      set({ people, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  async filterByRelationship(type) {
    set({ loading: true, error: null });
    try {
      const people = type ? await filterPeopleByRelationship(type) : await getPeople();
      set({ people, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  async addPerson(input) {
    const person = await addPerson(input);
    set(s => ({ people: [person, ...s.people] }));
    return person;
  },

  async updatePerson(id, input) {
    const updated = await updatePerson(id, input);
    set(s => ({ people: s.people.map(p => (p.id === id ? updated : p)) }));
    return updated;
  },

  async deletePerson(id) {
    await deletePerson(id);
    set(s => ({ people: s.people.filter(p => p.id !== id) }));
  },

  async addPlace(input) {
    const place = await placesRepository.create(input);
    set(s => ({ places: [...s.places, place] }));
    return place;
  },
}));
