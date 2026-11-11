import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

export interface LoadingViewProps {
  message?: string;
  /** Fills the available space and centres — for whole-screen loads. */
  fullScreen?: boolean;
}

export function LoadingView({ message, fullScreen = true }: Readonly<LoadingViewProps>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message ?? 'Loading'}
      style={[styles.container, fullScreen ? styles.fullScreen : styles.inline]}
    >
      <ActivityIndicator size="large" color={theme.colors.brand} />
      {message ? (
        <AppText variant="caption" color="textSecondary">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  fullScreen: { flex: 1 },
  inline: { paddingVertical: 24 },
});
