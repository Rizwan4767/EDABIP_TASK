import type { ReactNode } from 'react';
import {
  ImageBackground,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

/**
 * Smooth Figma auth gradient:
 * linear-gradient(167.95deg, #000000 11.75%, #134B4A 29.83%)
 */
const gradientPng = require('@/assets/images/auth-screen-gradient.png');

const WEB_GRADIENT = {
  // RN Web supports CSS backgrounds on View.
  backgroundImage: 'linear-gradient(167.95deg, #000000 11.75%, #134B4A 29.83%)',
} as const;

export interface AuthLinearGradientProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function AuthLinearGradient({ children, style }: Readonly<AuthLinearGradientProps>) {
  if (Platform.OS === 'web') {
    return <View style={[styles.root, WEB_GRADIENT, style]}>{children}</View>;
  }

  return (
    <ImageBackground
      source={gradientPng}
      style={[styles.root, style]}
      resizeMode="cover"
      imageStyle={styles.image}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#134B4A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
