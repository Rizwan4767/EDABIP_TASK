import { Platform, type ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

function shadow(offsetY: number, radius: number, opacity: number, elevation: number): ShadowStyle {
  return Platform.select<ShadowStyle>({
    android: { elevation },
    default: {
      shadowColor: '#0B2B2A',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
  });
}

/** Mirrors the web `--db-card-shadow` / `--db-shadow` elevation ramp. */
export const shadows = {
  none: {} as ShadowStyle,
  xs: shadow(1, 2, 0.06, 1),
  sm: shadow(2, 4, 0.08, 2),
  md: shadow(4, 10, 0.1, 4),
  lg: shadow(8, 20, 0.14, 8),
} as const;

export type ShadowToken = keyof typeof shadows;
