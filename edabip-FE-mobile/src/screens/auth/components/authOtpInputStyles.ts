import { Platform, StyleSheet } from 'react-native';

import type { AuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { palette } from '@/theme/colors';

export function createAuthOtpInputStyles(layout: AuthSignupLayout) {
  const boxSize = Math.round(Math.max(44, Math.min(52, 48 * layout.scale)));

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Math.round(12 * layout.scale),
    },
    box: {
      width: boxSize,
      height: boxSize,
      borderWidth: 1.5,
      borderColor: '#151515',
      borderRadius: 6,
      backgroundColor: palette.white,
      textAlign: 'center',
      fontSize: layout.fontSize,
      lineHeight: layout.fontSize + 4,
      color: '#151515',
      fontFamily: 'Inter_400Regular',
      ...(Platform.OS === 'android'
        ? { textAlignVertical: 'center' as const, includeFontPadding: false }
        : {}),
    },
    boxFilled: {
      color: '#151515',
    },
    boxError: {
      borderColor: palette.red500,
      backgroundColor: palette.red100,
    },
    boxErrorDigit: {
      color: palette.red500,
      fontFamily: 'Inter_700Bold',
    },
    error: {
      marginTop: 8,
    },
  });
}
