export const PlaceType = {
  COLLEGE: 'college',
  SCHOOL: 'school',
  OFFICE: 'office',
  CUSTOM: 'custom',
} as const;

export type PlaceTypeValue = (typeof PlaceType)[keyof typeof PlaceType];

export const PLACE_TYPE_LABELS: Record<PlaceTypeValue, string> = {
  college: 'College',
  school: 'School',
  office: 'Office',
  custom: 'Custom',
};
