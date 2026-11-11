import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { appConfig } from '@/config/appConfig';
import { useTheme } from '@/hooks/useTheme';

export interface AuthIntroProps {
  title: string;
  subtitle: string;
  /** Hides the brand wordmark on secondary steps such as OTP entry. */
  showBrand?: boolean;
}

/** Shared heading block for the authentication screens. */
export function AuthIntro({ title, subtitle, showBrand = true }: Readonly<AuthIntroProps>) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {showBrand ? (
        <View style={[styles.brand, { backgroundColor: theme.colors.brand }]}>
          <AppText variant="h3" style={{ color: theme.colors.textOnBrand }}>
            {appConfig.appName}
          </AppText>
        </View>
      ) : null}

      <AppText variant="h1">{title}</AppText>
      <AppText variant="body" color="textSecondary">
        {subtitle}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, marginBottom: 28 },
  brand: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
  },
});
