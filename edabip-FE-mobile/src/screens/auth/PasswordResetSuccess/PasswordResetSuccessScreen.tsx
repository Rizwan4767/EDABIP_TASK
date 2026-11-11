import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { ROUTES } from '@/navigation/routes';
import { AuthCurvedSheet } from '@/screens/auth/components/AuthCurvedSheet';
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthLink } from '@/screens/auth/components/AuthLink';
import { AuthMobileHero } from '@/screens/auth/components/AuthMobileHero';
import { createPasswordResetSuccessStyles } from '@/screens/auth/PasswordResetSuccess/passwordResetSuccessStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { palette } from '@/theme/colors';

const checkIcon = require('@/assets/images/Check.png');

export function PasswordResetSuccessScreen() {
  const router = useRouter();
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createPasswordResetSuccessStyles(layout), [layout]);

  return (
    <AuthLinearGradient style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.header}>
            <AuthMobileHero />
          </View>

          <AuthCurvedSheet variant="resetPassword">
            <View style={styles.cardContent}>
              <View style={styles.welcomeBlock}>
                <AppText style={styles.welcomeTitle}>You&apos;re All Set!</AppText>
                <AppText style={styles.welcomeSubtitle}>
                  Your password has been reset successfully. Use your new password to securely
                  access your EDABIP account.
                </AppText>
              </View>

              <View style={styles.successIconWrap}>
                <Image
                  source={checkIcon}
                  style={styles.successIcon}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel="Password reset successful"
                />
              </View>

              <Pressable
                onPress={() => router.replace(ROUTES.auth.login)}
                style={styles.submitButton}
                accessibilityRole="button"
                accessibilityLabel="Login"
                testID="password-reset-success-login"
              >
                <AppText style={styles.submitLabel}>Login</AppText>
              </Pressable>

              <View style={styles.footerRow}>
                <AppText style={styles.footerText}>Don&apos;t have an account? </AppText>
                <AuthLink href={ROUTES.auth.signup} replace style={styles.footerLink}>
                  Sign Up
                </AuthLink>
              </View>

              <View style={styles.socialRow}>
                <Pressable
                  style={styles.socialButton}
                  disabled
                  accessibilityRole="button"
                  accessibilityLabel="Google login coming soon"
                >
                  <Ionicons name="logo-google" size={18} color={palette.teal700} />
                </Pressable>
                <Pressable
                  style={styles.socialButton}
                  disabled
                  accessibilityRole="button"
                  accessibilityLabel="Microsoft login coming soon"
                >
                  <Ionicons name="logo-microsoft" size={18} color={palette.teal700} />
                </Pressable>
              </View>
            </View>
          </AuthCurvedSheet>
        </ScrollView>
      </SafeAreaView>
    </AuthLinearGradient>
  );
}
