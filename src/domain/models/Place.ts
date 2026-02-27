import type { PlaceTypeValue } from '../../shared/constants/places';

export interface Place {
  id: string;
  name: string;
  type: PlaceTypeValue;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePlaceInput {
  name: string;
  type: PlaceTypeValue;
}
