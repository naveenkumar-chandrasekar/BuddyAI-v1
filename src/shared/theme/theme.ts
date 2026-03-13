import { MD3LightTheme } from 'react-native-paper';

// ─── Semantic color tokens (use these in screens instead of hex literals) ────

export const Colors = {
  // Brand
  primary: '#5C33D4',
  primaryLight: '#EDE9FF',
  primaryDark: '#3A1FA8',
  primaryOnLight: '#FFFFFF',

  // Accent / secondary
  secondary: '#0F9D9D',
  secondaryLight: '#D0F5F5',

  // States
  success: '#16A34A',
  successLight: '#DCFCE7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  // Surfaces
  background: '#F6F4FF',
  surface: '#FFFFFF',
  surfaceVariant: '#F0ECFF',
  surfaceTint: '#EDE9FF',
  outline: '#D1C8F0',
  outlineVariant: '#EAE5F6',

  // Text
  onSurface: '#110A2E',
  textSecondary: '#5C5480',
  textMuted: '#9E94C0',

  // Relationship colors
  family: '#E53935',
  friend: '#7B2FBE',
  school: '#1565C0',
  work: '#2E7D32',
  other: '#E65100',
  custom: '#00838F',

  // Priority colors
  priorityHigh: '#DC2626',
  priorityMedium: '#D97706',
  priorityLow: '#16A34A',

  // Task status colors
  statusMissed: '#DC2626',
  statusCancelled: '#9E94C0',
  statusDone: '#16A34A',
  statusInProgress: '#2563EB',
};

// ─── MD3 Paper theme ─────────────────────────────────────────────────────────

export const AppTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.primaryOnLight,
    primaryContainer: Colors.primaryLight,
    onPrimaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: Colors.secondaryLight,
    onSecondaryContainer: '#003737',
    tertiary: '#C2185B',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFD6E7',
    onTertiaryContainer: '#3D0020',
    error: Colors.error,
    onError: '#FFFFFF',
    errorContainer: Colors.errorLight,
    onErrorContainer: '#7A0000',
    background: Colors.background,
    onBackground: Colors.onSurface,
    surface: Colors.surface,
    onSurface: Colors.onSurface,
    surfaceVariant: Colors.surfaceVariant,
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.outline,
    outlineVariant: Colors.outlineVariant,
    shadow: '#000000',
    scrim: '#000000',
    inverseSurface: '#211749',
    inverseOnSurface: '#EDE9FF',
    inversePrimary: '#C8BAFF',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#F0ECFF',
      level2: '#EAE5FF',
      level3: '#E3DCFF',
      level4: '#DFDAFF',
      level5: '#D8D1FF',
    },
  },
} as const;

export type AppThemeType = typeof AppTheme;
