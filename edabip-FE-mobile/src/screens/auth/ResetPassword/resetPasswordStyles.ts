import { Platform, StyleSheet } from 'react-native';

import type { AuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { palette } from '@/theme/colors';

const softShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0 0 4px rgba(0,0,0,0.25)' }
    : {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
      };

export function createResetPasswordStyles(layout: AuthSignupLayout) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    keyboardAvoid: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingBottom: layout.isSmall ? 24 : 32,
    },
    header: {
      backgroundColor: 'transparent',
      overflow: 'visible',
      paddingBottom: 4,
    },
    cardContent: {
      width: layout.forgotContentWidth,
      maxWidth: '100%',
      alignSelf: 'center',
      gap: layout.forgotSectionGap,
    },
    welcomeBlock: {
      alignItems: 'center',
      gap: 8,
    },
    welcomeTitle: {
      color: '#151515',
      fontSize: layout.isSmall ? 18 : 20,
      lineHeight: layout.isSmall ? 24 : 28,
      fontFamily: 'Inter_700Bold',
      textAlign: 'center',
    },
    welcomeSubtitle: {
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      lineHeight: layout.isSmall ? 18 : 22,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      letterSpacing: -0.24,
    },
    form: {
      gap: layout.forgotSectionGap,
    },
    field: {
      height: layout.fieldHeight,
      borderWidth: 1.5,
      borderColor: '#151515',
      borderRadius: 6,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'android' ? 0 : 2,
      fontSize: layout.fontSize,
      lineHeight: layout.fontSize + 4,
      letterSpacing: -0.32,
      color: '#151515',
      backgroundColor: palette.white,
      fontFamily: 'Inter_400Regular',
      ...(Platform.OS === 'android'
        ? { textAlignVertical: 'center' as const, includeFontPadding: false }
        : {}),
    },
    fieldPassword: {
      borderColor: '#134B4A',
      color: '#134B4A',
      paddingRight: 40,
    },
    fieldError: {
      borderColor: palette.red500,
    },
    fieldMessage: {
      marginTop: -8,
    },
    passwordWrap: {
      position: 'relative',
    },
    eyeButton: {
      position: 'absolute',
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: 'center',
    },
    submitButton: {
      height: layout.fieldHeight,
      borderRadius: 100,
      backgroundColor: palette.teal700,
      alignItems: 'center',
      justifyContent: 'center',
      ...softShadow,
    },
    submitButtonDisabled: {
      backgroundColor: '#D9D9D9',
    },
    submitLabel: {
      color: palette.white,
      fontSize: layout.fontSize,
      fontFamily: 'Inter_400Regular',
    },
    footerLink: {
      color: palette.teal700,
      fontSize: layout.fontSize,
      fontFamily: 'Inter_600SemiBold',
      textAlign: 'center',
    },
  });
}
