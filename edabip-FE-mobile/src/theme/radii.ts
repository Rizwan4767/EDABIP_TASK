export const radii = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  /** Large enough to fully round any control height used in the app. */
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radii;
