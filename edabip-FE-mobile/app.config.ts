import type { ConfigContext, ExpoConfig } from 'expo/config';

import { resolveDevLanIp } from './scripts/resolve-dev-lan-ip.mjs';

type AppEnvironment = 'development' | 'testing' | 'production';

const BRAND_TEAL = '#134B4A';

const VARIANTS: Record<AppEnvironment, { name: string; identifier: string; scheme: string }> = {
  development: { name: 'EDABIP Dev', identifier: 'com.edabip.mobile.dev', scheme: 'edabip-dev' },
  testing: { name: 'EDABIP Test', identifier: 'com.edabip.mobile.test', scheme: 'edabip-test' },
  production: { name: 'EDABIP', identifier: 'com.edabip.mobile', scheme: 'edabip' },
};

function resolveEnvironment(): AppEnvironment {
  const value = process.env.EXPO_PUBLIC_APP_ENV;
  if (value === 'testing' || value === 'production') {
    return value;
  }
  return 'development';
}

export default function createExpoConfig({ config }: ConfigContext): ExpoConfig {
  const appEnv = resolveEnvironment();
  const variant = VARIANTS[appEnv];
  const devApiHost = appEnv === 'production' ? undefined : resolveDevLanIp();

  return {
    ...config,
    name: variant.name,
    slug: 'edabip-fe-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: variant.scheme,
    userInterfaceStyle: 'automatic',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: variant.identifier,
    },
    android: {
      package: variant.identifier,
      predictiveBackGestureEnabled: false,
      intentFilters: [
        {
          action: 'VIEW',
          data: [{ scheme: variant.scheme }],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      adaptiveIcon: {
        backgroundColor: BRAND_TEAL,
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-font',
      'expo-sharing',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow EDABIP to access your photos so you can update your profile picture.',
          cameraPermission: false,
          microphonePermission: false,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: appEnv !== 'production',
          },
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
          backgroundColor: BRAND_TEAL,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      appEnv,
      devApiHost,
      eas: {
        projectId: 'b67df5cb-418e-45a4-a747-d0d0fcee0415',
      },
    },
  };
}
