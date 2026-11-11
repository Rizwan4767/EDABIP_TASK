import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
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
import { createSignupStyles } from '@/screens/auth/Signup/signupStyles';
import {
  goToSignupOtp,
  isEmailAlreadyRegistered,
  mapSignupFieldErrors,
} from '@/screens/auth/utils/authFlow';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { ApiError } from '@/services/api/apiError';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/colors';
import { isValidEmail, isValidPassword } from '@/utils/validation';

// How far below the focused field's bottom edge to scroll, so the field
// isn't flush against the keyboard/screen edge.
function requiredWhenEmpty(
  showValidation: boolean,
  value: string,
  message: string,
  submitError?: string,
): string | undefined {
  if (showValidation && value.trim() === '') return message;
  return submitError;
}

function emailFieldError(
  showValidation: boolean,
  email: string,
  submitError?: string,
): string | undefined {
  if (showValidation && !isValidEmail(email)) return 'Enter a valid email address.';
  return submitError;
}

function passwordFieldError(
  showValidation: boolean,
  password: string,
  submitError?: string,
): string | undefined {
  if (showValidation && !isValidPassword(password)) return 'Password does not meet requirements.';
  return submitError;
}

const FIELD_SCROLL_OFFSET = 120;

function scrollFocusedFieldIntoView(
  scrollRef: RefObject<ScrollView | null>,
  fieldRef: RefObject<TextInput | null>,
) {
  const scrollNode = scrollRef.current;
  const fieldNode = fieldRef.current;
  if (!scrollNode || !fieldNode) return;

  fieldNode.measureLayout(
    scrollNode as unknown as number,
    (_x, y, _width, height) => {
      scrollNode.scrollTo({ y: Math.max(y + height - FIELD_SCROLL_OFFSET, 0), animated: true });
    },
    () => {},
  );
}

async function runSignupAttempt({
  signUp,
  resendEmailOtp,
  router,
  firstName,
  lastName,
  email,
  password,
}: {
  signUp: ReturnType<typeof useAuth>['signUp'];
  resendEmailOtp: ReturnType<typeof useAuth>['resendEmailOtp'];
  router: ReturnType<typeof useRouter>;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    await signUp({ firstName, lastName, email, password });
    goToSignupOtp(router, email, true);
  } catch (error) {
    if (isEmailAlreadyRegistered(error)) {
      const resend = await resendEmailOtp(email);
      if (resend.isFullyVerified) {
        throw new ApiError({
          message: 'This email is already registered. Please log in.',
          status: 400,
          code: 'bad_request',
          fieldErrors: { email: 'This email is already registered. Please log in.' },
        });
      }
      goToSignupOtp(router, email, true);
      return;
    }
    if (error instanceof ApiError && Object.keys(error.fieldErrors).length > 0) {
      throw new ApiError({
        message: error.message,
        status: error.status,
        code: error.code,
        fieldErrors: mapSignupFieldErrors(error.fieldErrors),
      });
    }
    throw error;
  }
}

export function SignupScreen() {
  const router = useRouter();
  const { signUp, resendEmailOtp } = useAuth();
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createSignupStyles(layout), [layout]);
  const scrollRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const submit = useAsyncAction(() =>
    runSignupAttempt({
      signUp,
      resendEmailOtp,
      router,
      firstName,
      lastName,
      email,
      password,
    }),
  );

  const firstNameError = requiredWhenEmpty(
    showValidation,
    firstName,
    'Enter your first name.',
    submit.fieldErrors.first_name,
  );
  const lastNameError = requiredWhenEmpty(
    showValidation,
    lastName,
    'Enter your last name.',
    submit.fieldErrors.last_name,
  );
  const emailError = emailFieldError(showValidation, email, submit.fieldErrors.email);
  const passwordError = passwordFieldError(showValidation, password, submit.fieldErrors.password);
  const confirmPasswordError =
    showValidation && confirmPassword !== password ? 'Passwords do not match.' : null;
  const termsError =
    showValidation && !agreedToTerms ? 'Please accept the Terms & Conditions.' : null;

  const isValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    isValidEmail(email) &&
    isValidPassword(password) &&
    confirmPassword === password &&
    agreedToTerms;

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
            nestedScrollEnabled
          >
            <View style={styles.header}>
              <AuthMobileHero />
            </View>

            <AuthCurvedSheet>
              <AuthTabSwitcher
                active="signup"
                onLoginPress={() => router.replace(ROUTES.auth.login)}
              />

              <View style={styles.form}>
                {submit.error ? <ErrorBanner message={submit.error} /> : null}

                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter Your First Name"
                  placeholderTextColor="#151515"
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  style={[styles.field, firstNameError ? styles.fieldError : null]}
                  accessibilityLabel="First name"
                />
                {firstNameError ? (
                  <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                    {firstNameError}
                  </AppText>
                ) : null}

                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter Your Last Name"
                  placeholderTextColor="#151515"
                  autoCapitalize="words"
                  autoComplete="family-name"
                  textContentType="familyName"
                  style={[styles.field, lastNameError ? styles.fieldError : null]}
                  accessibilityLabel="Last name"
                />
                {lastNameError ? (
                  <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                    {lastNameError}
                  </AppText>
                ) : null}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter Your Email"
                  placeholderTextColor="#151515"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
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
                    ref={passwordRef}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter Your Password"
                    placeholderTextColor="#134B4A"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onFocus={() => {
                      requestAnimationFrame(() => {
                        scrollFocusedFieldIntoView(scrollRef, passwordRef);
                      });
                    }}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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

                <TextInput
                  ref={confirmPasswordRef}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm Your Password"
                  placeholderTextColor="#134B4A"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  onFocus={() => {
                    requestAnimationFrame(() => {
                      scrollFocusedFieldIntoView(scrollRef, confirmPasswordRef);
                    });
                  }}
                  style={[
                    styles.field,
                    styles.fieldPassword,
                    confirmPasswordError ? styles.fieldError : null,
                  ]}
                  accessibilityLabel="Confirm password"
                />
                {confirmPasswordError ? (
                  <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                    {confirmPasswordError}
                  </AppText>
                ) : null}

                <Pressable
                  style={styles.termsRow}
                  onPress={() => setAgreedToTerms((checked) => !checked)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreedToTerms }}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms ? (
                      <Ionicons name="checkmark" size={12} color={palette.white} />
                    ) : null}
                  </View>
                  <AppText style={styles.termsText}>I agree to Terms & Conditions</AppText>
                </Pressable>
                {termsError ? (
                  <AppText variant="caption" color="danger" style={styles.fieldMessage}>
                    {termsError}
                  </AppText>
                ) : null}

                <Pressable
                  onPress={handleSubmit}
                  disabled={!isValid || submit.isPending}
                  style={[
                    styles.submitButton,
                    (!isValid || submit.isPending) && styles.submitButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create account"
                  testID="signup-submit"
                >
                  {submit.isPending ? (
                    <ActivityIndicator color={palette.white} />
                  ) : (
                    <AppText style={styles.submitLabel}>Create Account</AppText>
                  )}
                </Pressable>

                <View style={styles.footerRow}>
                  <AppText style={styles.footerText}>Already have an account? </AppText>
                  <AuthLink href={ROUTES.auth.login} replace style={styles.footerLink}>
                    Login
                  </AuthLink>
                </View>

                <View style={styles.socialRow}>
                  <Pressable
                    style={styles.socialButton}
                    disabled
                    accessibilityRole="button"
                    accessibilityLabel="Google sign-up coming soon"
                  >
                    <Ionicons name="logo-google" size={18} color={palette.teal700} />
                  </Pressable>
                  <Pressable
                    style={styles.socialButton}
                    disabled
                    accessibilityRole="button"
                    accessibilityLabel="Microsoft sign-up coming soon"
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
