import { Image, type ImageStyle, type StyleProp } from 'react-native';

const logoPng = require('@/assets/images/logo.png');

export interface EdabipLogoProps {
  width?: number;
  height?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
}

/** EDABIP wordmark + mark. Uses PNG so it works without native SVG linking. */
export function EdabipLogo({
  width = 73,
  height = 29,
  accessibilityLabel = 'EDABIP',
  style,
}: Readonly<EdabipLogoProps>) {
  return (
    <Image
      source={logoPng}
      style={[{ width, height }, style]}
      resizeMode="contain"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
