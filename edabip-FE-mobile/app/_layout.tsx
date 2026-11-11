import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { RazorpayCheckoutHost } from '@/services/billing/RazorpayCheckoutHost';
import { StoreProvider, useApp, useAuth } from '@/store';
import { appFonts, ensureWebInterFonts } from '@/theme/fonts';
import { logger } from '@/utils/logger';

void SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web') {
  ensureWebInterFonts();
}

export default function RootLayout() {
  // Web uses CSS @font-face (see ensureWebInterFonts). Native keeps expo-font.
  const [fontsLoaded, fontError] = useFonts(Platform.OS === 'web' ? {} : appFonts);
  const fontsReady = Platform.OS === 'web' || fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError && Platform.OS !== 'web') {
      // Rendering with the system font is better than blocking the app.
      logger.warn('fonts', 'Failed to load Inter; falling back to system fonts', fontError);
    }
  }, [fontError]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <RootNavigator fontsReady={fontsReady} />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Holds the splash screen until fonts, stored preferences, and the persisted
 * session have all resolved, so the first frame is never an auth flicker.
 */
function RootNavigator({ fontsReady }: Readonly<{ fontsReady: boolean }>) {
  const theme = useTheme();
  const { isReady: preferencesReady } = useApp();
  const { status } = useAuth();

  const isReady = fontsReady && preferencesReady && status !== 'bootstrapping';

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme.colors.background]);

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
      <RazorpayCheckoutHost />
    </>
  );
}
