import { Q } from '@nozbe/watermelondb';
import { getDb } from '../database/database';
import PersonModel from '../database/models/PersonModel';
import PersonConnectionModel from '../database/models/PersonConnectionModel';
import type { IPeopleRepository } from '../../domain/repositories/IPeopleRepository';
import type { Person, CreatePersonInput, UpdatePersonInput } from '../../domain/models/Person';
import type { PersonConnection, CreatePersonConnectionInput } from '../../domain/models/PersonConnection';
import type { PriorityValue } from '../../shared/constants/priority';
import type { RelationshipTypeValue } from '../../shared/constants/relationships';

function toConnection(m: PersonConnectionModel): PersonConnection {
  return {
    id: m.id,
    personId: m.personId,
    relatedPersonId: m.relatedPersonId,
    label: m.label,
    createdAt: m.createdAt.getTime(),
  };
}

function toPerson(m: PersonModel): Person {
  return {
    id: m.id,
    name: m.name,
    relationshipType: m.relationshipType as RelationshipTypeValue,
    customRelation: m.customRelation,
    placeId: m.placeId,
    priority: m.priority as PriorityValue,
    birthday: m.birthday,
    phone: m.phone,
    notes: m.notes,
    createdAt: m.createdAt.getTime(),
    updatedAt: m.updatedAt.getTime(),
  };
}

export class PeopleRepository implements IPeopleRepository {
  private get collection() { return getDb().collections.get<PersonModel>('people'); }
  private get connCollection() { return getDb().collections.get<PersonConnectionModel>('person_connections'); }

  async getAll(): Promise<Person[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0))
      .fetch();
    return records.map(toPerson);
  }

  async getById(id: string): Promise<Person | null> {
    try {
      const record = await this.collection.find(id);
      return record.isDeleted ? null : toPerson(record);
    } catch {
      return null;
    }
  }

  async search(query: string): Promise<Person[]> {
    const lower = query.toLowerCase();
    const all = await this.getAll();
    return all.filter(p => p.name.toLowerCase().includes(lower));
  }

  async filterByRelationship(type: string): Promise<Person[]> {
    const records = await this.collection
      .query(Q.where('is_deleted', 0), Q.where('relationship_type', type))
      .fetch();
    return records.map(toPerson);
  }

  async create(input: CreatePersonInput): Promise<Person> {
    const record = await getDb().write(async () =>
      this.collection.create(r => {
        r.name = input.name;
        r.relationshipType = input.relationshipType;
        r.customRelation = input.customRelation ?? null;
        r.placeId = input.placeId ?? null;
        r.priority = input.priority;
        r.birthday = input.birthday ?? null;
        r.phone = input.phone ?? null;
        r.notes = input.notes ?? null;
        r.isDeleted = 0;
      }),
    );
    return toPerson(record);
  }

  async update(id: string, input: UpdatePersonInput): Promise<Person> {
    const record = await getDb().write(async () => {
      const r = await this.collection.find(id);
      await r.update(m => {
        if (input.name !== undefined) m.name = input.name;
        if (input.relationshipType !== undefined) m.relationshipType = input.relationshipType;
        if (input.customRelation !== undefined) m.customRelation = input.customRelation ?? null;
        if (input.placeId !== undefined) m.placeId = input.placeId ?? null;
        if (input.priority !== undefined) m.priority = input.priority;
        if (input.birthday !== undefined) m.birthday = input.birthday ?? null;
        if (input.phone !== undefined) m.phone = input.phone ?? null;
        if (input.notes !== undefined) m.notes = input.notes ?? null;
      });
      return r;
    });
    return toPerson(record);
  }

  async remove(id: string): Promise<void> {
    await getDb().write(async () => {
      const record = await this.collection.find(id);
      await record.update(r => { r.isDeleted = 1; });
    });
  }

  async getConnectionsForPerson(personId: string): Promise<PersonConnection[]> {
    const records = await this.connCollection
      .query(Q.where('is_deleted', 0), Q.or(Q.where('person_id', personId), Q.where('related_person_id', personId)))
      .fetch();
    return records.map(toConnection);
  }

  async addConnection(input: CreatePersonConnectionInput): Promise<PersonConnection> {
    const record = await getDb().write(async () =>
      this.connCollection.create(r => {
        r.personId = input.personId;
        r.relatedPersonId = input.relatedPersonId;
        r.label = input.label;
        r.isDeleted = 0;
      }),
    );
    return toConnection(record);
  }

  async removeConnection(id: string): Promise<void> {
    await getDb().write(async () => {
      const record = await this.connCollection.find(id);
      await record.update(r => { r.isDeleted = 1; });
    });
  }
}

export const peopleRepository = new PeopleRepository();
