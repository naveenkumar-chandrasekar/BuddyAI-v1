import type { PriorityValue } from '../../shared/constants/priority';
import type { RelationshipTypeValue } from '../../shared/constants/relationships';

export interface Person {
  id: string;
  name: string;
  relationshipType: RelationshipTypeValue;
  customRelation: string | null;
  placeId: string | null;
  priority: PriorityValue;
  birthday: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePersonInput {
  name: string;
  relationshipType: RelationshipTypeValue;
  customRelation?: string;
  placeId?: string;
  priority: PriorityValue;
  birthday?: string;
  phone?: string;
  notes?: string;
}

export type UpdatePersonInput = Partial<CreatePersonInput>;
