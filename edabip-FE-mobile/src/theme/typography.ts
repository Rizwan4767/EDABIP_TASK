import type { TextStyle } from 'react-native';

/**
 * The web app pairs Inter (product/marketing surfaces) with Lato (dashboard).
 * Mobile standardises on Inter alone: two families cost an extra font payload
 * and read almost identically at phone sizes.
 *
 * Keys map to the font names registered in `src/theme/fonts.ts`.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 18,
  base: 22,
  md: 24,
  lg: 26,
  xl: 28,
  xxl: 32,
  xxxl: 38,
  display: 44,
} as const;

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'caption'
  | 'label'
  | 'overline'
  | 'button';

export const textVariants: Record<TextVariant, TextStyle> = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.display,
    lineHeight: lineHeight.display,
    letterSpacing: -0.6,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xxxl,
    lineHeight: lineHeight.xxxl,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xxl,
    lineHeight: lineHeight.xxl,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  bodyStrong: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    lineHeight: lineHeight.base,
  },
  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
  },
  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    lineHeight: lineHeight.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    letterSpacing: 0.1,
  },
};

export const typography = { fontFamily, fontSize, lineHeight, textVariants } as const;
