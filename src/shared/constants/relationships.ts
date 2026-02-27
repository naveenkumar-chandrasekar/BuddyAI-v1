export const RelationshipType = {
  FAMILY: 'family',
  COLLEGE: 'college',
  SCHOOL: 'school',
  OFFICE: 'office',
  OTHER: 'other',
  CUSTOM: 'custom',
} as const;

export type RelationshipTypeValue = (typeof RelationshipType)[keyof typeof RelationshipType];

export const RELATIONSHIP_LABELS: Record<RelationshipTypeValue, string> = {
  family: 'Family',
  college: 'College',
  school: 'School',
  office: 'Office',
  other: 'Other',
  custom: 'Custom',
};
