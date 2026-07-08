export const colors = {
  primary: '#4f46e5',
  primaryPressed: '#4338ca',
  secondary: '#e0e7ff',
  secondaryPressed: '#c7d2fe',
  surface: '#ffffff',
  border: '#d4d4d8',
  textPrimary: '#18181b',
  textInverse: '#ffffff',
  textMuted: '#71717a',
  danger: '#dc2626',
  disabled: '#e4e4e7',
  textDisabled: '#a1a1aa',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const fontSizes = {
  sm: 13,
  md: 15,
  lg: 17,
} as const;

export type Color = keyof typeof colors;
export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
export type FontSize = keyof typeof fontSizes;
