import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/buttons/Button';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: Readonly<ErrorStateProps>) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.dangerSurface }]}>
        <Ionicons
          name="alert-circle-outline"
          size={theme.dimensions.icon.xl}
          color={theme.colors.danger}
        />
      </View>

      <AppText variant="h3" align="center">
        {title}
      </AppText>

      <AppText variant="body" color="textSecondary" align="center" style={styles.message}>
        {message}
      </AppText>

      {onRetry ? (
        <Button label={retryLabel} onPress={onRetry} variant="outline" fullWidth={false} />
      ) : null}
    </View>
  );
}

/** Inline variant for form-level and card-level failures. */
export function ErrorBanner({ message }: Readonly<{ message: string }>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        { backgroundColor: theme.colors.dangerSurface, borderRadius: theme.radii.md },
      ]}
    >
      <Ionicons name="alert-circle" size={theme.dimensions.icon.md} color={theme.colors.danger} />
      <AppText variant="caption" color="danger" style={styles.bannerText}>
        {message}
      </AppText>
    </View>
  );
}

/** Inline variant for form-level and card-level confirmations (mirrors ErrorBanner). */
export function SuccessBanner({ message }: Readonly<{ message: string }>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        { backgroundColor: theme.colors.successSurface, borderRadius: theme.radii.md },
      ]}
    >
      <Ionicons
        name="checkmark-circle"
        size={theme.dimensions.icon.md}
        color={theme.colors.success}
      />
      <AppText variant="caption" color="success" style={styles.bannerText}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { maxWidth: 320 },
  banner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12 },
  bannerText: { flex: 1 },
});
