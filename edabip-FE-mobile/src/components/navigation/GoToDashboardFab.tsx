import { useEffect } from 'react';
import { Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabHomeIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { goToDashboardFabStyles as styles } from '@/components/navigation/goToDashboardFabStyles';
import { useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';

const LABEL = 'Go to Dashboard';
const HIDE_MS = 220;
const HIDE_TRANSLATE_Y = 72;

export interface GoToDashboardFabProps {
  /**
   * Lift the pill by the home-indicator inset. Off when the FAB already sits
   * above a tab bar that consumes the safe area.
   */
  includeSafeArea?: boolean;
  /** When false, the pill slides down and is not interactive. Defaults to true. */
  visible?: boolean;
}

/**
 * Bottom pill for stack screens that are not in the primary tab footer
 * (Users, Billing, Settings). Content keeps scrolling underneath it.
 */
export function GoToDashboardFab({
  includeSafeArea = true,
  visible = true,
}: Readonly<GoToDashboardFabProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const shown = useSharedValue(visible ? 1 : 0);
  const bottom = includeSafeArea
    ? Math.max(insets.bottom, theme.spacing.base) + theme.spacing.sm
    : theme.spacing.base;

  useEffect(() => {
    shown.value = withTiming(visible ? 1 : 0, { duration: HIDE_MS });
  }, [shown, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: interpolate(shown.value, [0, 1], [HIDE_TRANSLATE_Y, 0]) }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? 'box-none' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.dock, { bottom }, animatedStyle]}
    >
      <Pressable
        onPress={() => router.navigate(ROUTES.main.dashboard)}
        accessibilityRole="button"
        accessibilityLabel={LABEL}
        accessibilityHint="Opens the dashboard"
        style={({ pressed }) => [
          styles.button,
          theme.shadows.md,
          {
            backgroundColor: theme.colors.brand,
            borderRadius: theme.radii.pill,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <Image
          source={TabHomeIcon}
          resizeMode="contain"
          style={[styles.icon, { tintColor: theme.colors.textOnBrand }]}
        />
        <AppText variant="button" color="textOnBrand" style={styles.label}>
          {LABEL}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}
