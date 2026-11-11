import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthLink } from '@/screens/auth/components/AuthLink';
import { AuthMobileHero } from '@/screens/auth/components/AuthMobileHero';
import { AuthTabSwitcher } from '@/screens/auth/components/AuthTabSwitcher';
import { createLoginStyles } from '@/screens/auth/Login/loginStyles';
import {
  goToAccountLocked,
  goToSignupOtp,
  isAccountLocked,
  isEmailVerificationRequired,
} from '@/screens/auth/utils/authFlow';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { PREFERENCE_KEYS } from '@/constants/storageKeys';
import { getPreference, removePreference, setPreference } from '@/services/storage';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/colors';
import { isValidEmail, normalizeEmail } from '@/utils/validation';

async function runLoginAttempt({
  signIn,
  resendEmailOtp,
  router,
  email,
  password,
  rememberMe,
}: {
  signIn: ReturnType<typeof useAuth>['signIn'];
  resendEmailOtp: ReturnType<typeof useAuth>['resendEmailOtp'];
  router: ReturnType<typeof useRouter>;
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  const normalizedEmail = normalizeEmail(email);
  try {
    await signIn({ email: normalizedEmail, password });

    if (rememberMe) {
      void setPreference(PREFERENCE_KEYS.lastSignedInEmail, normalizedEmail);
    } else {
      void removePreference(PREFERENCE_KEYS.lastSignedInEmail);
    }
  } catch (error) {
    if (isAccountLocked(error)) {
      goToAccountLocked(router, normalizedEmail, error.message);
      return;
    }
    if (isEmailVerificationRequired(error)) {
      await resendEmailOtp(normalizedEmail);
      goToSignupOtp(router, normalizedEmail);
      return;
    }
    throw error;
  }
}

export function LoginScreen() {
  const router = useRouter();
  const { signIn, resendEmailOtp } = useAuth();
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createLoginStyles(layout), [layout]);
  const scrollRef = useRef<ScrollView>(null);

  const scrollFieldIntoView = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getPreference(PREFERENCE_KEYS.lastSignedInEmail, '').then((savedEmail) => {
      if (cancelled || !savedEmail) return;
      setEmail(savedEmail);
      setRememberMe(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = useAsyncAction(() =>
    runLoginAttempt({
      signIn,
      resendEmailOtp,
      router,
      email,
      password,
      rememberMe,
    }),
  );

  const emailError =
    showValidation && !isValidEmail(email)
      ? 'Enter a valid email address.'
      : submit.fieldErrors.email;
  const passwordError =
    showValidation && password.length === 0 ? 'Enter your password.' : submit.fieldErrors.password;

  const isValid = isValidEmail(email) && password.length > 0;

  const handleSubmit = () => {
    setShowValidation(true);
    if (!isValid) return;
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
            ref={scrollRef}
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

            <AuthCurvedSheet>
              <View style={styles.welcomeBlock}>
                <AppText style={styles.welcomeTitle}>Welcome Back</AppText>
                <AppText style={styles.welcomeSubtitle}>
                  Login into continue to your EDABIP dashboard and accelerate your analytics journey
                </AppText>
              </View>

              <AuthTabSwitcher
                active="login"
                onSignupPress={() => router.replace(ROUTES.auth.signup)}
                onLoginPress={() => router.replace(ROUTES.auth.login)}
              />

              <View style={styles.form}>
                {submit.error ? <ErrorBanner message={submit.error} /> : null}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter Your Email"
                  placeholderTextColor="#151515"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  style={[styles.field, emailError ? styles.fieldError : null]}
                  accessibilityLabel="Email"
                />
                {emailError ? (
                  <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                    {emailError}
                  </AppText>
                ) : null}

                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter Your Password"
                    placeholderTextColor="#134B4A"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onFocus={scrollFieldIntoView}
                    onSubmitEditing={handleSubmit}
                    style={[
                      styles.field,
                      styles.fieldPassword,
                      passwordError ? styles.fieldError : null,
                    ]}
                    accessibilityLabel="Password"
                  />
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
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

                <View style={styles.optionsRow}>
                  <Pressable
                    style={styles.rememberRow}
                    onPress={() => setRememberMe((checked) => !checked)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe ? (
                        <Ionicons name="checkmark" size={12} color={palette.white} />
                      ) : null}
                    </View>
                    <AppText style={styles.rememberText}>Remember me</AppText>
                  </Pressable>

                  <AuthLink href={ROUTES.auth.forgotPassword} style={styles.forgotLink}>
                    Forgot Password?
                  </AuthLink>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || submit.isPending}
                  style={[
                    styles.submitButton,
                    (!isValid || submit.isPending) && styles.submitButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Login"
                  testID="login-submit"
                >
                  {submit.isPending ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <AppText style={styles.submitLabel}>Login</AppText>
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
            </AuthCurvedSheet>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AuthLinearGradient>
  );
}
