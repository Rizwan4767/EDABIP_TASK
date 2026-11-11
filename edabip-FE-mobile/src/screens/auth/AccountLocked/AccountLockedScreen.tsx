import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { ErrorBanner, SuccessBanner } from '@/components/common/ErrorState';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { readAccountLockedParams } from '@/navigation/params';
import { ROUTES } from '@/navigation/routes';
import { createAccountLockedStyles } from '@/screens/auth/AccountLocked/accountLockedStyles';
import { AuthCurvedSheet } from '@/screens/auth/components/AuthCurvedSheet';
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthLink } from '@/screens/auth/components/AuthLink';
import { AuthMobileHero } from '@/screens/auth/components/AuthMobileHero';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { palette } from '@/theme/colors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

function resolveEmailError(
  showValidation: boolean,
  trimmedEmail: string,
  submitEmailError?: string,
): string | undefined {
  if (showValidation && trimmedEmail === '') return 'Email is required.';
  if (showValidation && !isValidEmail(trimmedEmail)) return 'Enter a valid email address.';
  return submitEmailError;
}

/**
 * No self-service unlock endpoint exists yet — the backend only auto-unlocks
 * after the lockout window (`utils/security.py: is_account_locked`). The
 * submit handler below is a local stub until that endpoint ships.
 */
export function AccountLockedScreen() {
  const params = readAccountLockedParams(useLocalSearchParams());
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createAccountLockedStyles(layout), [layout]);

  const [email, setEmail] = useState(params.email ? normalizeEmail(params.email) : '');
  const [showValidation, setShowValidation] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = useAsyncAction(async () => {
    const normalizedEmail = normalizeEmail(email.trim());
    await simulateUnlockRequest(normalizedEmail);
    setSent(true);
  });

  const trimmedEmail = email.trim();
  const emailError = resolveEmailError(showValidation, trimmedEmail, submit.fieldErrors.email);

  const canSubmit = trimmedEmail !== '' && isValidEmail(trimmedEmail);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setSent(false);
    if (submit.error || Object.keys(submit.fieldErrors).length > 0) {
      submit.reset();
    }
  };

  const handleSubmit = () => {
    setShowValidation(true);
    if (!canSubmit || submit.isPending) return;
    void submit.run();
  };

  return (
    <AuthLinearGradient style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.header}>
              <AuthMobileHero />
            </View>

            <AuthCurvedSheet variant="forgotPassword">
              <View style={styles.cardContent}>
                <View style={styles.welcomeBlock}>
                  <AppText style={styles.welcomeTitle}>Account Temporarily Locked</AppText>
                  <AppText style={styles.welcomeSubtitle}>
                    {params.message ??
                      'We detected multiple failed sign-in attempts. For your security, access to your account has been temporarily restricted.'}
                  </AppText>
                </View>

                <View style={styles.form}>
                  {submit.error ? <ErrorBanner message={submit.error} /> : null}
                  {sent && !submit.error ? (
                    <SuccessBanner message="If that email is on a locked account, we've sent instructions to unlock it." />
                  ) : null}

                  <TextInput
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="Enter Your Email"
                    placeholderTextColor="#151515"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="send"
                    onSubmitEditing={handleSubmit}
                    style={[styles.field, emailError ? styles.fieldError : null]}
                    accessibilityLabel="Email"
                  />
                  {emailError ? (
                    <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                      {emailError}
                    </AppText>
                  ) : null}

                  <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit || submit.isPending}
                    style={[
                      styles.submitButton,
                      (!canSubmit || submit.isPending) && styles.submitButtonDisabled,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Unlock Account"
                    testID="account-locked-submit"
                  >
                    {submit.isPending ? (
                      <ActivityIndicator color={palette.white} />
                    ) : (
                      <AppText style={styles.submitLabel}>Unlock Account</AppText>
                    )}
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
              </View>
            </AuthCurvedSheet>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthLinearGradient>
  );
}

/**
 * Placeholder only — replace with a real API call once an unlock endpoint
 * exists. Never wired to the network so it can't 404 silently.
 */
function simulateUnlockRequest(_email: string): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}
