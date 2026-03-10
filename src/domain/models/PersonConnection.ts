export interface PersonConnection {
  id: string;
  personId: string;
  relatedPersonId: string;
  label: string;
  createdAt: number;
}

export interface CreatePersonConnectionInput {
  personId: string;
  relatedPersonId: string;
  label: string;
}
