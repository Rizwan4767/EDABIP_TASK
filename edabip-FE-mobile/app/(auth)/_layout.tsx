import { Redirect, Stack } from 'expo-router';

import { useTheme } from '@/hooks/useTheme';
import { useNavigationReady } from '@/navigation/useNavigationReady';
import { HOME_ROUTE } from '@/navigation/routes';
import { useAuth } from '@/store/auth';

export const unstable_settings = { initialRouteName: 'landing' };

/**
 * Unauthenticated section. Signed-in users are bounced into the app shell;
 * everyone else stays here on landing / login / signup / recovery flows.
 */
export default function AuthLayout() {
  const theme = useTheme();
  const { status } = useAuth();
  const navigationReady = useNavigationReady();

  if (status === 'authenticated') {
    if (!navigationReady) return null;
    return <Redirect href={HOME_ROUTE} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="landing" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="password-reset-success" />
      <Stack.Screen name="account-locked" />
    </Stack>
  );
}
