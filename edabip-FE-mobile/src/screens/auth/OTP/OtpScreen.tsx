import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { ErrorBanner } from '@/components/common/ErrorState';
import { appConfig } from '@/config/appConfig';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useCountdown } from '@/hooks/useCountdown';
import { readOtpParams } from '@/navigation/params';
import { ROUTES } from '@/navigation/routes';
import { AuthCurvedSheet } from '@/screens/auth/components/AuthCurvedSheet';
import { AuthLinearGradient } from '@/screens/auth/components/AuthLinearGradient';
import { AuthMobileHero } from '@/screens/auth/components/AuthMobileHero';
import { AuthOtpInput } from '@/screens/auth/components/AuthOtpInput';
import { createOtpStyles } from '@/screens/auth/OTP/otpStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme/colors';
import { formatOtpResendCountdown } from '@/utils/format';
import { isValidOtp } from '@/utils/validation';

export function OtpScreen() {
  const router = useRouter();
  const params = readOtpParams(useLocalSearchParams());
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createOtpStyles(layout), [layout]);

  const { pendingVerificationEmail, verifyEmailOtp, resendEmailOtp } = useAuth();

  const email = params.email ?? pendingVerificationEmail ?? '';

  const [code, setCode] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const cooldown = useCountdown(appConfig.auth.otpResendCooldownSeconds);

  const verify = useAsyncAction(async (value: string) => {
    const result = await verifyEmailOtp(email, value);
    if (result.isFullyVerified) {
      router.replace(ROUTES.auth.login);
    }
  });

  const resend = useAsyncAction(async () => {
    await resendEmailOtp(email);
    setCode('');
    cooldown.restart();
  });

  const handleVerify = (value: string = code) => {
    setShowValidation(true);
    if (!isValidOtp(value)) return;
    void verify.run(value);
  };

  const handleResend = () => {
    if (!cooldown.isComplete || resend.isPending) return;
    void resend.run();
  };

  const codeError =
    showValidation && !isValidOtp(code)
      ? `Enter the ${appConfig.auth.otpLength}-digit code.`
      : (verify.error ?? null);

  const canVerify = isValidOtp(code) && !verify.isPending;
  const canResend = cooldown.isComplete && !resend.isPending;

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

            <AuthCurvedSheet variant="otp" style={styles.cardSheet}>
              <View style={styles.cardContent}>
                <View style={styles.titleBlock}>
                  <AppText style={styles.title}>Enter Verification Code</AppText>
                  <AppText style={styles.subtitle}>
                    {email ? (
                      <>
                        We&apos;ve sent a {appConfig.auth.otpLength}-digit verification code to{' '}
                        <AppText style={[styles.subtitle, styles.subtitleEmail]}>{email}</AppText>.
                      </>
                    ) : (
                      `We've sent a ${appConfig.auth.otpLength}-digit verification code to your email.`
                    )}
                  </AppText>
                </View>

                <View style={styles.form}>
                  {resend.error ? <ErrorBanner message={resend.error} /> : null}

                  <AuthOtpInput
                    value={code}
                    onChange={(next) => {
                      setCode(next);
                      setShowValidation(false);
                      verify.reset();
                    }}
                    onComplete={handleVerify}
                    error={codeError}
                    disabled={verify.isPending}
                    autoFocus
                  />

                  <View style={styles.resendBlock}>
                    <View style={styles.resendRow}>
                      <AppText style={styles.resendPrompt}>Didn&apos;t receive the code? </AppText>
                      <Pressable
                        onPress={handleResend}
                        disabled={!canResend}
                        accessibilityRole="button"
                        accessibilityLabel="Resend OTP"
                        accessibilityState={{ disabled: !canResend }}
                      >
                        <AppText
                          style={[styles.resendLink, !canResend ? styles.resendLinkDisabled : null]}
                        >
                          Resend OTP
                        </AppText>
                      </Pressable>
                    </View>

                    <AppText style={styles.resendTimer}>
                      Resend OTP {formatOtpResendCountdown(cooldown.secondsLeft)}
                    </AppText>
                  </View>

                  <Pressable
                    onPress={() => handleVerify()}
                    disabled={!canVerify}
                    style={[styles.submitButton, !canVerify && styles.submitButtonDisabled]}
                    accessibilityRole="button"
                    accessibilityLabel="Verify OTP"
                    testID="otp-submit"
                  >
                    {verify.isPending ? (
                      <ActivityIndicator color={palette.white} />
                    ) : (
                      <AppText style={styles.submitLabel}>Verify OTP</AppText>
                    )}
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
