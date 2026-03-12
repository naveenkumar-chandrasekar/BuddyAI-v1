import { getPeople, searchPeople } from '../GetPeopleUseCase';
import { addPerson } from '../AddPersonUseCase';
import { updatePerson } from '../UpdatePersonUseCase';
import { deletePerson } from '../DeletePersonUseCase';
import { Priority } from '../../../../shared/constants/priority';
import { RelationshipType } from '../../../../shared/constants/relationships';

jest.mock('../../../../data/repositories/PeopleRepository', () => ({
  personRepository: {
    getAll: jest.fn(),
    search: jest.fn(),
    filterByRelationship: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

const { personRepository } = jest.requireMock('../../../../data/repositories/PeopleRepository');

const MOCK_PERSON = {
  id: 'p1',
  name: 'Alice',
  relationshipType: RelationshipType.FAMILY,
  customRelation: null,

  priority: Priority.HIGH,
  birthday: null,
  phone: null,
  notes: null,
  email: null,
  lastContactedAt: null,
  contactFrequency: null,
  createdAt: 1000,
  updatedAt: 1000,
};

describe('GetPeopleUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns all people', async () => {
    personRepository.getAll.mockResolvedValue([MOCK_PERSON]);
    const result = await getPeople();
    expect(result).toEqual([MOCK_PERSON]);
    expect(personRepository.getAll).toHaveBeenCalledTimes(1);
  });

  it('calls getAll when query is empty', async () => {
    personRepository.getAll.mockResolvedValue([]);
    await searchPeople('');
    expect(personRepository.getAll).toHaveBeenCalled();
    expect(personRepository.search).not.toHaveBeenCalled();
  });

  it('calls search when query is non-empty', async () => {
    personRepository.search.mockResolvedValue([MOCK_PERSON]);
    const result = await searchPeople('Alice');
    expect(personRepository.search).toHaveBeenCalledWith('Alice');
    expect(result).toEqual([MOCK_PERSON]);
  });
});

describe('AddPersonUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a person', async () => {
    personRepository.create.mockResolvedValue(MOCK_PERSON);
    const result = await addPerson({
      name: 'Alice',
      relationshipType: RelationshipType.FAMILY,
      priority: Priority.HIGH,
    });
    expect(result).toEqual(MOCK_PERSON);
    expect(personRepository.create).toHaveBeenCalledTimes(1);
  });

  it('throws if name is empty', async () => {
    await expect(
      addPerson({ name: '  ', relationshipType: RelationshipType.FAMILY, priority: Priority.HIGH }),
    ).rejects.toThrow('Name is required');
    expect(personRepository.create).not.toHaveBeenCalled();
  });
});

describe('UpdatePersonUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls repository update', async () => {
    const updated = { ...MOCK_PERSON, name: 'Alice B.' };
    personRepository.update.mockResolvedValue(updated);
    const result = await updatePerson('p1', { name: 'Alice B.' });
    expect(result.name).toBe('Alice B.');
    expect(personRepository.update).toHaveBeenCalledWith('p1', { name: 'Alice B.' });
  });
});

describe('DeletePersonUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls repository remove', async () => {
    personRepository.remove.mockResolvedValue(undefined);
    await deletePerson('p1');
    expect(personRepository.remove).toHaveBeenCalledWith('p1');
  });
});
