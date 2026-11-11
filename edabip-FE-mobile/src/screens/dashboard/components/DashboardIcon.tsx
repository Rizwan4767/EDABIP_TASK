import { Image, View, type ImageSourcePropType } from 'react-native';

import { dashboardIconStyles } from '@/screens/dashboard/components/dashboardIconStyles';

export interface DashboardIconProps {
  icon: ImageSourcePropType;
  size?: number;
  width?: number;
  height?: number;
  color?: string;
  accessibilityLabel?: string;
}

/**
 * Raster icons (PNG) so the dashboard renders on a development client that
 * was built without `react-native-svg` native views.
 */
export function DashboardIcon({
  icon,
  size = 24,
  width,
  height,
  color,
  accessibilityLabel,
}: Readonly<DashboardIconProps>) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <View
      pointerEvents="none"
      style={[dashboardIconStyles.wrap, { width: w, height: h }]}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={icon}
        resizeMode="contain"
        style={[{ width: w, height: h }, color ? { tintColor: color } : null]}
      />
    </View>
  );
}
