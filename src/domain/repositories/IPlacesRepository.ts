import type { Place, CreatePlaceInput } from '../models/Place';

export interface IPlacesRepository {
  getAll(): Promise<Place[]>;
  getById(id: string): Promise<Place | null>;
  create(input: CreatePlaceInput): Promise<Place>;
  remove(id: string): Promise<void>;
}
