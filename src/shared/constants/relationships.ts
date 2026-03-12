export const RelationshipType = {
  FAMILY: 'family',
  FRIEND: 'friend',
  WORK: 'work',
  SCHOOL: 'school',
  OTHER: 'other',
  CUSTOM: 'custom',
} as const;

export type RelationshipTypeValue = (typeof RelationshipType)[keyof typeof RelationshipType];

export const RELATIONSHIP_LABELS: Record<RelationshipTypeValue, string> = {
  family: 'Family',
  friend: 'Friend',
  work: 'Work',
  school: 'School',
  other: 'Other',
  custom: 'Custom',
};
