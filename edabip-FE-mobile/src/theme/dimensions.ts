import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * Layout constants. `screen` is captured once at module load; anything that has
 * to react to rotation or split-screen should use `useWindowDimensions()`.
 */
export const dimensions = {
  screen: {
    width,
    height,
    isSmall: width < 360,
    isTablet: width >= 768,
  },

  /** 44pt is the smallest reliably tappable target on both platforms. */
  minTouchTarget: 44,

  control: {
    heightSm: 36,
    heightMd: 44,
    heightLg: 52,
  },

  icon: {
    xs: 14,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  header: {
    height: 56,
  },

  tabBar: {
    height: Platform.select({ ios: 52, default: 58 }),
    iconSize: 22,
  },

  avatar: {
    sm: 32,
    md: 40,
    lg: 64,
  },

  /** Consistent gutter for screen-level horizontal padding. */
  screenGutter: 20,

  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
} as const;
