export const Priority = {
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

export type PriorityValue = (typeof Priority)[keyof typeof Priority];

export const PRIORITY_LABELS: Record<PriorityValue, string> = {
  [Priority.HIGH]: 'High',
  [Priority.MEDIUM]: 'Medium',
  [Priority.LOW]: 'Low',
};
