import { useMemo, useRef } from 'react';
import {
  Platform,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { appConfig } from '@/config/appConfig';
import { createAuthOtpInputStyles } from '@/screens/auth/components/authOtpInputStyles';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';

const OTP_SLOT_IDS = [
  'otp-0',
  'otp-1',
  'otp-2',
  'otp-3',
  'otp-4',
  'otp-5',
  'otp-6',
  'otp-7',
] as const;

export interface AuthOtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

/**
 * Figma-aligned segmented OTP entry for the auth flow — square boxes with masked digits.
 */
export function AuthOtpInput({
  value,
  onChange,
  length = appConfig.auth.otpLength,
  error,
  disabled = false,
  autoFocus = false,
  onComplete,
}: Readonly<AuthOtpInputProps>) {
  const layout = useAuthSignupLayout();
  const styles = useMemo(() => createAuthOtpInputStyles(layout), [layout]);
  const inputs = useRef<(TextInput | null)[]>([]);
  const hasError = Boolean(error);

  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  const commit = (next: string) => {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length) {
      onComplete?.(trimmed);
    }
  };

  const focusAt = (index: number) => {
    inputs.current[Math.min(Math.max(index, 0), length - 1)]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned === '') return;

    const next = (value.slice(0, index) + cleaned).slice(0, length);
    commit(next);
    focusAt(next.length);
  };

  const handleKeyPress =
    (index: number) => (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      if (event.nativeEvent.key !== 'Backspace') return;

      if (digits[index]) {
        commit(value.slice(0, index) + value.slice(index + 1));
        return;
      }

      if (index > 0) {
        commit(value.slice(0, index - 1));
        focusAt(index - 1);
      }
    };

  const displayDigit = (digit: string) => {
    if (!digit) return '';
    return hasError ? digit : '*';
  };

  return (
    <View>
      <View
        style={styles.row}
        accessibilityLabel={`${length} digit verification code`}
        accessibilityHint={error ?? undefined}
      >
        {digits.map((digit, index) => {
          const isFilled = digit !== '';
          return (
            <TextInput
              key={OTP_SLOT_IDS[index] ?? `otp-box-${index + 1}`}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={displayDigit(digit)}
              onChangeText={(raw) => handleChange(index, raw)}
              onKeyPress={handleKeyPress(index)}
              keyboardType="number-pad"
              inputMode="numeric"
              textContentType={index === 0 ? 'oneTimeCode' : 'none'}
              autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
              maxLength={length}
              selectTextOnFocus
              editable={!disabled}
              autoFocus={autoFocus && index === 0}
              accessibilityLabel={`Digit ${index + 1}`}
              style={[
                styles.box,
                isFilled && !hasError && styles.boxFilled,
                hasError && styles.boxError,
                hasError && isFilled && styles.boxErrorDigit,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}
