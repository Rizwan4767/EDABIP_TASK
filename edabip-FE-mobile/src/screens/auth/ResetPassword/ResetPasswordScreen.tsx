import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { readResetPasswordParams } from '@/navigation/params';
import { ROUTES } from '@/navigation/routes';
import { AuthCurvedSheet } from '@/screens/auth/components/AuthCurvedSheet';
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthLink } from '@/screens/auth/components/AuthLink';
import { AuthResetPasswordHero } from '@/screens/auth/components/AuthResetPasswordHero';
import { createResetPasswordStyles } from '@/screens/auth/ResetPassword/resetPasswordStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/colors';
import { isValidPassword } from '@/utils/validation';

function resolvePasswordError(
  showValidation: boolean,
  password: string,
  submitPasswordError?: string,
): string | undefined {
  if (showValidation && password.trim() === '') return 'Enter your password.';
  if (showValidation && !isValidPassword(password)) return 'Password does not meet requirements.';
  return submitPasswordError;
}

function resolveConfirmPasswordError(
  showValidation: boolean,
  password: string,
  confirmPassword: string,
): string | null {
  if (showValidation && confirmPassword.trim() === '') return 'Please confirm your password.';
  if (showValidation && password !== confirmPassword) return 'Your passwords do not match.';
  return null;
}

type ResetPasswordStyles = ReturnType<typeof createResetPasswordStyles>;

function ResetPasswordForm({
  styles,
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  passwordError,
  confirmPasswordError,
  tokenError,
  submitError,
  canSubmit,
  isPending,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: Readonly<{
  styles: ResetPasswordStyles;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  passwordError?: string;
  confirmPasswordError: string | null;
  tokenError: string | null;
  submitError: string | null;
  canSubmit: boolean;
  isPending: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: () => void;
}>) {
  const submitDisabled = !canSubmit || isPending || Boolean(tokenError);

  return (
    <View style={styles.cardContent}>
      <View style={styles.welcomeBlock}>
        <AppText style={styles.welcomeTitle}>Create New password</AppText>
        <AppText style={styles.welcomeSubtitle}>
          Create New Password into continue to your EDABIP dashboard and accelerate your analytics
          journey
        </AppText>
      </View>

      <View style={styles.form}>
        {tokenError ? <ErrorBanner message={tokenError} /> : null}
        {submitError ? <ErrorBanner message={submitError} /> : null}

        <View style={styles.passwordWrap}>
          <TextInput
            value={password}
            onChangeText={onPasswordChange}
            placeholder="Enter Your Password"
            placeholderTextColor="#134B4A"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            style={[styles.field, styles.fieldPassword, passwordError ? styles.fieldError : null]}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={onTogglePassword}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#134B4A"
            />
          </Pressable>
        </View>
        {passwordError ? (
          <AppText variant="caption" color="danger" style={styles.fieldMessage}>
            {passwordError}
          </AppText>
        ) : null}

        <View style={styles.passwordWrap}>
          <TextInput
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
            placeholder="Confirm Your Password"
            placeholderTextColor="#134B4A"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            style={[
              styles.field,
              styles.fieldPassword,
              confirmPasswordError ? styles.fieldError : null,
            ]}
            accessibilityLabel="Confirm password"
          />
          <Pressable
            onPress={onToggleConfirmPassword}
            style={styles.eyeButton}
            accessibilityRole="button"
            accessibilityLabel={
              showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
            }
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#134B4A"
            />
          </Pressable>
        </View>
        {confirmPasswordError ? (
          <AppText variant="caption" color="danger" style={styles.fieldMessage}>
            {confirmPasswordError}
          </AppText>
        ) : null}

        <Pressable
          onPress={onSubmit}
          disabled={submitDisabled}
          style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
          accessibilityRole="button"
          accessibilityLabel="Update password"
          testID="reset-password-submit"
        >
          {isPending ? (
            <ActivityIndicator color={palette.white} />
          ) : (
            <AppText style={styles.submitLabel}>Update</AppText>
          )}
        </Pressable>

        {tokenError ? (
          <AuthLink href={ROUTES.auth.forgotPassword} replace style={styles.footerLink}>
            Request a new reset link
          </AuthLink>
        ) : null}
      </View>
    </View>
  );
}

export function ResetPasswordScreen() {
  const router = useRouter();
  const params = readResetPasswordParams(useLocalSearchParams());
  const { resetPassword } = useAuth();
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createResetPasswordStyles(layout), [layout]);

  const token = params.token ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const submit = useAsyncAction(async () => {
    await resetPassword(token, password);
    router.replace(ROUTES.auth.passwordResetSuccess);
  });

  const passwordError = resolvePasswordError(
    showValidation,
    password,
    submit.fieldErrors.new_password,
  );

  const confirmPasswordError = resolveConfirmPasswordError(
    showValidation,
    password,
    confirmPassword,
  );

  const canSubmit =
    password.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    isValidPassword(password) &&
    password === confirmPassword;

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (submit.error || Object.keys(submit.fieldErrors).length > 0) {
      submit.reset();
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (submit.error || Object.keys(submit.fieldErrors).length > 0) {
      submit.reset();
    }
  };

  const handleSubmit = () => {
    setShowValidation(true);
    if (!canSubmit) return;
    void submit.run();
  };

  const tokenError = !token
    ? 'This reset link is invalid or missing. Please request a new one.'
    : null;

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
              <AuthResetPasswordHero />
            </View>

            <AuthCurvedSheet variant="resetPassword">
              <ResetPasswordForm
                styles={styles}
                password={password}
                confirmPassword={confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                passwordError={passwordError}
                confirmPasswordError={confirmPasswordError}
                tokenError={tokenError}
                submitError={submit.error}
                canSubmit={canSubmit}
                isPending={submit.isPending}
                onPasswordChange={handlePasswordChange}
                onConfirmPasswordChange={handleConfirmPasswordChange}
                onTogglePassword={() => setShowPassword((visible) => !visible)}
                onToggleConfirmPassword={() => setShowConfirmPassword((visible) => !visible)}
                onSubmit={handleSubmit}
              />
            </AuthCurvedSheet>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthLinearGradient>
  );
}
