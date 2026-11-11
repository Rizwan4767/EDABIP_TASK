import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Shows a back affordance. Defaults to `router.back()`. */
  showBack?: boolean;
  onBack?: () => void;
  /** Slot on the trailing edge — actions, avatars, filters. */
  accessory?: ReactNode;
}

/**
 * In-content header. Native stack/tab headers are disabled across the app so
 * titles scroll with content, which reads better on small screens.
 */
export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  accessory,
}: Readonly<ScreenHeaderProps>) {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable
          onPress={handleBack}
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[
            styles.back,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Ionicons name="chevron-back" size={theme.dimensions.icon.lg} color={theme.colors.text} />
        </Pressable>
      ) : null}

      <View style={styles.text}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {accessory}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  subtitle: { marginTop: 2 },
});
