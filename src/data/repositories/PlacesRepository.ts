import { db } from '../database/database';
import PlaceModel from '../database/models/PlaceModel';
import type { IPlacesRepository } from '../../domain/repositories/IPlacesRepository';
import type { Place, CreatePlaceInput } from '../../domain/models/Place';
import type { PlaceTypeValue } from '../../shared/constants/places';

function toPlace(m: PlaceModel): Place {
  return {
    id: m.id,
    name: m.name,
    type: m.type as PlaceTypeValue,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export class PlacesRepository implements IPlacesRepository {
  private collection = db.collections.get<PlaceModel>('places');

  async getAll(): Promise<Place[]> {
    const records = await this.collection.query().fetch();
    return records.filter(r => !r.isDeleted).map(toPlace);
  }

  async getById(id: string): Promise<Place | null> {
    try {
      const record = await this.collection.find(id);
      return record.isDeleted ? null : toPlace(record);
    } catch {
      return null;
    }
  }

  async create(input: CreatePlaceInput): Promise<Place> {
    const now = Date.now();
    const record = await db.write(async () =>
      this.collection.create(r => {
        r.name = input.name;
        r.type = input.type;
        r.isDeleted = 0;
        (r as unknown as { _raw: Record<string, unknown> })._raw.updated_at = now;
      }),
    );
    return toPlace(record);
  }

  async remove(id: string): Promise<void> {
    await db.write(async () => {
      const record = await this.collection.find(id);
      await record.update(r => {
        r.isDeleted = 1;
      });
    });
  }
}

export const placesRepository = new PlacesRepository();
