import { Image, View, type ImageSourcePropType } from 'react-native';

export interface LandingIconProps {
  icon: ImageSourcePropType;
  width: number;
  height: number;
  accessibilityLabel?: string;
}

/** Raster landing icons. Width and height are the designed outer box, not a shared default. */
export function LandingIcon({
  icon,
  width,
  height,
  accessibilityLabel,
}: Readonly<LandingIconProps>) {
  return (
    <View
      style={{ width, height }}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      accessibilityLabel={accessibilityLabel}
    >
      <Image source={icon} resizeMode="contain" style={{ width, height }} />
    </View>
  );
}
