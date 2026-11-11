import { darkColors, lightColors, palette, type ColorScheme } from './colors';
import { dimensions } from './dimensions';
import { radii } from './radii';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export type ColorSchemeName = 'light' | 'dark';

export interface Theme {
  scheme: ColorSchemeName;
  colors: ColorScheme;
  palette: typeof palette;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typography: typeof typography;
  dimensions: typeof dimensions;
}

const shared = { palette, spacing, radii, shadows, typography, dimensions } as const;

export const lightTheme: Theme = { scheme: 'light', colors: lightColors, ...shared };
export const darkTheme: Theme = { scheme: 'dark', colors: darkColors, ...shared };

export function getTheme(scheme: ColorSchemeName): Theme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export { darkColors, lightColors, palette } from './colors';
export type { ColorScheme } from './colors';
export { dimensions } from './dimensions';
export { radii } from './radii';
export type { RadiusToken } from './radii';
export { shadows } from './shadows';
export type { ShadowToken } from './shadows';
export { spacing } from './spacing';
export type { SpacingToken } from './spacing';
export { fontFamily, fontSize, lineHeight, textVariants, typography } from './typography';
export type { TextVariant } from './typography';
