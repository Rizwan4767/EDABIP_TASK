import { Redirect, Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { useNavigationReady } from '@/navigation/useNavigationReady';
import { ROUTES } from '@/navigation/routes';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';

export const unstable_settings = { initialRouteName: '(tabs)' };

/**
 * Authenticated section. The tab bar lives in `(tabs)`; Users, billing, AI,
 * and settings are pushed full-screen over it so they get a real back gesture
 * instead of competing for a tab slot.
 */
export default function MainLayout() {
  const theme = useTheme();
  const { status } = useAuth();
  const navigationReady = useNavigationReady();

  if (status !== 'authenticated') {
    if (!navigationReady) return null;
    return <Redirect href={ROUTES.auth.landing} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: palette.white } }} />
      <Stack.Screen name="users" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="ai" />
      <Stack.Screen name="more" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="update-profile" />
      <Stack.Screen name="payment-history" />
    </Stack>
  );
}
