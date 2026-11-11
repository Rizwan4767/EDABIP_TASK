import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { ErrorBanner } from '@/components/common/ErrorState';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ROUTES } from '@/navigation/routes';
import { AuthCurvedSheet } from '@/screens/auth/components/AuthCurvedSheet';
import { AuthForgotPasswordHero } from '@/screens/auth/components/AuthForgotPasswordHero';
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthLink } from '@/screens/auth/components/AuthLink';
import { createForgotPasswordStyles } from '@/screens/auth/ForgotPassword/forgotPasswordStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/colors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

type ForgotPasswordStep = 'request' | 'sent';

function resolveEmailError(
  showValidation: boolean,
  trimmedEmail: string,
  submitEmailError?: string,
): string | undefined {
  if (showValidation && trimmedEmail === '') return 'Email is required.';
  if (showValidation && !isValidEmail(trimmedEmail)) return 'Enter a valid email address.';
  return submitEmailError;
}

type ForgotPasswordStyles = ReturnType<typeof createForgotPasswordStyles>;

function ForgotPasswordRequestStep({
  styles,
  email,
  emailError,
  canSubmit,
  isPending,
  error,
  onEmailChange,
  onSubmit,
}: Readonly<{
  styles: ForgotPasswordStyles;
  email: string;
  emailError?: string;
  canSubmit: boolean;
  isPending: boolean;
  error: string | null;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
}>) {
  return (
    <>
      <View style={styles.welcomeBlock}>
        <AppText style={styles.welcomeTitle}>Forgot Password</AppText>
        <AppText style={styles.welcomeSubtitle}>
          No worries! Enter your email address and we&apos;ll send you instructions to reset your
          password.
        </AppText>
      </View>

      <View style={styles.form}>
        {error ? <ErrorBanner message={error} /> : null}

        <TextInput
          value={email}
          onChangeText={onEmailChange}
          placeholder="Enter Your Email"
          placeholderTextColor="#151515"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          style={[styles.field, emailError ? styles.fieldError : null]}
          accessibilityLabel="Email"
        />
        {emailError ? (
          <AppText variant="caption" color="danger" style={styles.fieldMessage}>
            {emailError}
          </AppText>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit || isPending}
          style={[styles.submitButton, (!canSubmit || isPending) && styles.submitButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Send reset"
          testID="forgot-password-submit"
        >
          {isPending ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <AppText style={styles.submitLabel}>Send Reset</AppText>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <AppText style={styles.footerText}>Already have an account? </AppText>
          <AuthLink href={ROUTES.auth.login} replace style={styles.footerLink}>
            Back to Login
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
    </>
  );
}

function ForgotPasswordSentStep({
  styles,
  email,
  isPending,
  error,
  onBackToLogin,
  onResend,
}: Readonly<{
  styles: ForgotPasswordStyles;
  email: string;
  isPending: boolean;
  error: string | null;
  onBackToLogin: () => void;
  onResend: () => void;
}>) {
  return (
    <>
      <View style={styles.welcomeBlock}>
        <AppText style={styles.welcomeTitle}>Check Your Email</AppText>
        <AppText style={styles.welcomeSubtitle}>
          If an account exists for <AppText style={styles.welcomeEmail}>{email}</AppText>, we have
          sent a password reset link to your inbox.
        </AppText>
      </View>

      <View style={styles.form}>
        {error ? <ErrorBanner message={error} /> : null}

        <Pressable
          onPress={onBackToLogin}
          style={styles.submitButton}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <AppText style={styles.submitLabel}>Back to Login</AppText>
        </Pressable>

        <Pressable
          onPress={onResend}
          disabled={isPending}
          style={[styles.secondaryButton, isPending && styles.secondaryButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Resend reset link"
        >
          {isPending ? (
            <ActivityIndicator color={palette.teal700} />
          ) : (
            <AppText style={styles.secondaryButtonLabel}>Resend link</AppText>
          )}
        </Pressable>
      </View>
    </>
  );
}

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useAuth();
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createForgotPasswordStyles(layout), [layout]);

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const submit = useAsyncAction(async () => {
    const normalizedEmail = normalizeEmail(email.trim());
    await requestPasswordReset(normalizedEmail);
    setEmail(normalizedEmail);
    // Backend returns the same generic message whether or not the email exists.
    setStep('sent');
  });

  const trimmedEmail = email.trim();
  const emailError = resolveEmailError(showValidation, trimmedEmail, submit.fieldErrors.email);

  const canSubmit = trimmedEmail !== '' && isValidEmail(trimmedEmail);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (submit.error || Object.keys(submit.fieldErrors).length > 0) {
      submit.reset();
    }
  };

  const handleSubmit = () => {
    setShowValidation(true);
    if (!canSubmit) return;
    void submit.run();
  };

  const handleResend = () => {
    if (!isValidEmail(trimmedEmail) || submit.isPending) return;
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
              <AuthForgotPasswordHero />
            </View>

            <AuthCurvedSheet variant="forgotPassword">
              <View style={styles.cardContent}>
                {step === 'request' ? (
                  <ForgotPasswordRequestStep
                    styles={styles}
                    email={email}
                    emailError={emailError}
                    canSubmit={canSubmit}
                    isPending={submit.isPending}
                    error={submit.error}
                    onEmailChange={handleEmailChange}
                    onSubmit={handleSubmit}
                  />
                ) : (
                  <ForgotPasswordSentStep
                    styles={styles}
                    email={email}
                    isPending={submit.isPending}
                    error={submit.error}
                    onBackToLogin={() => router.replace(ROUTES.auth.login)}
                    onResend={handleResend}
                  />
                )}
              </View>
            </AuthCurvedSheet>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthLinearGradient>
  );
}
