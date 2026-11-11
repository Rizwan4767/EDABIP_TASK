/**
 * EDABIP brand palette, transcribed from the web application's CSS custom
 * properties so mobile and web stay visually consistent.
 *
 * Sources:
 *  - `edabip-frontend/src/modules/dashboard/pages/DashboardPage.css` (--db-*)
 *  - `edabip-frontend/src/modules/landing-page-v2/Landing-page-v2.css` (--lv2-*)
 */
export const palette = {
  teal900: '#0B4C49',
  teal800: '#0F5956',
  teal700: '#134B4A',
  teal500: '#3E9593',
  teal400: '#4EA9A0',
  teal100: '#E9F5F3',
  teal50: '#F2FFF0',

  gold500: '#F5C85B',

  ink900: '#101B1B',
  ink800: '#1A1A1A',
  ink500: '#5F6D6B',
  ink400: '#6B7280',

  grey100: '#F5F7F7',
  grey200: '#E5E7EB',
  grey300: '#DCE9E7',

  white: '#FFFFFF',
  black: '#000000',

  green500: '#2DA20A',
  green100: '#E7FEB7',
  red500: '#DD2D30',
  red100: '#FDE7E7',
  amber500: '#E8A317',
  amber100: '#FFDD9A',
  blue500: '#2563EB',
  blue100: '#DBEAFE',
} as const;

/**
 * Semantic colour tokens. Screens must consume these rather than `palette`
 * directly, so that light/dark mode resolves automatically.
 */
export interface ColorScheme {
  brand: string;
  brandStrong: string;
  brandMuted: string;
  brandSurface: string;
  accent: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSunken: string;
  searchField: string;
  overlay: string;

  border: string;
  borderStrong: string;

  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  textOnBrand: string;

  success: string;
  successSurface: string;
  danger: string;
  dangerSurface: string;
  warning: string;
  warningSurface: string;
  info: string;
  infoSurface: string;

  disabled: string;
  disabledText: string;
  focusRing: string;
  skeleton: string;
}

export const lightColors: ColorScheme = {
  brand: palette.teal700,
  brandStrong: palette.teal900,
  brandMuted: palette.teal500,
  brandSurface: palette.teal100,
  accent: palette.gold500,

  background: palette.grey100,
  surface: palette.white,
  surfaceElevated: palette.white,
  surfaceSunken: palette.grey100,
  searchField: '#F5F5F5',
  overlay: 'rgba(16, 27, 27, 0.45)',

  border: palette.grey200,
  borderStrong: palette.grey300,

  text: palette.ink800,
  textSecondary: palette.ink500,
  textMuted: palette.ink400,
  textInverse: palette.white,
  textOnBrand: palette.white,

  success: palette.green500,
  successSurface: palette.green100,
  danger: palette.red500,
  dangerSurface: palette.red100,
  warning: palette.amber500,
  warningSurface: palette.amber100,
  info: palette.blue500,
  infoSurface: palette.blue100,

  disabled: palette.grey200,
  disabledText: palette.ink400,
  focusRing: palette.teal400,
  skeleton: '#E8EDEC',
};

export const darkColors: ColorScheme = {
  brand: palette.teal400,
  brandStrong: palette.teal500,
  brandMuted: palette.teal500,
  brandSurface: '#12302F',
  accent: palette.gold500,

  background: '#0A1514',
  surface: '#12211F',
  surfaceElevated: '#182B29',
  surfaceSunken: '#0A1514',
  searchField: '#1C2E2C',
  overlay: 'rgba(0, 0, 0, 0.6)',

  border: '#233A38',
  borderStrong: '#2E4A47',

  text: '#F2F6F5',
  textSecondary: '#AFC2BF',
  textMuted: '#7F9997',
  textInverse: palette.ink900,
  textOnBrand: palette.ink900,

  success: '#5FCB3E',
  successSurface: '#1B3318',
  danger: '#FF6B6D',
  dangerSurface: '#3A1A1B',
  warning: '#F2B33D',
  warningSurface: '#3A2C12',
  info: '#6C9BFF',
  infoSurface: '#182742',

  disabled: '#233A38',
  disabledText: '#6D8482',
  focusRing: palette.teal400,
  skeleton: '#1C2E2C',
};
