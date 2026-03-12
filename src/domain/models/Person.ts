import type { PriorityValue } from '../../shared/constants/priority';
import type { RelationshipTypeValue } from '../../shared/constants/relationships';

export interface Person {
  id: string;
  name: string;
  relationshipType: RelationshipTypeValue;
  customRelation: string | null;
  priority: PriorityValue;
  birthday: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  lastContactedAt: number | null;
  contactFrequency: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreatePersonInput {
  name: string;
  relationshipType: RelationshipTypeValue;
  customRelation?: string;
  priority: PriorityValue;
  birthday?: string;
  phone?: string;
  email?: string;
  notes?: string;
  lastContactedAt?: number;
  contactFrequency?: string;
}

export type UpdatePersonInput = Partial<CreatePersonInput>;
