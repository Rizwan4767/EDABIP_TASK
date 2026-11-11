import { useRef } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { AppText } from '@/components/common/AppText';
import { appConfig } from '@/config/appConfig';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

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

function otpBoxBorderColor(hasError: boolean, isFilled: boolean, theme: Theme): string {
  if (hasError) return theme.colors.danger;
  if (isFilled) return theme.colors.brand;
  return theme.colors.border;
}

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Defaults to the backend's 4-digit OTP length. */
  length?: number;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

/**
 * Segmented OTP entry with auto-advance, backspace-to-previous, and support for
 * SMS/keyboard autofill pasting the whole code into the first box.
 */
export function OtpInput({
  value,
  onChange,
  length = appConfig.auth.otpLength,
  error,
  disabled = false,
  autoFocus = false,
  onComplete,
}: Readonly<OtpInputProps>) {
  const theme = useTheme();
  const inputs = useRef<(TextInput | null)[]>([]);

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

    // A multi-character value means autofill or paste: spread it from here on.
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

  return (
    <View>
      <View style={styles.row} accessibilityLabel={`${length} digit verification code`}>
        {digits.map((digit, index) => {
          const isFilled = digit !== '';
          return (
            <TextInput
              key={OTP_SLOT_IDS[index] ?? `otp-slot-${index + 1}`}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={digit}
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
                theme.typography.textVariants.h2,
                {
                  color: theme.colors.text,
                  backgroundColor: disabled ? theme.colors.surfaceSunken : theme.colors.surface,
                  borderRadius: theme.radii.md,
                  borderWidth: isFilled || error ? 1.5 : 1,
                  borderColor: otpBoxBorderColor(Boolean(error), isFilled, theme),
                },
              ]}
            />
          );
        })}
      </View>

      {error ? (
        <AppText variant="caption" color="danger" align="center" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  box: { width: 56, height: 60, textAlign: 'center' },
  error: { marginTop: 10 },
});
