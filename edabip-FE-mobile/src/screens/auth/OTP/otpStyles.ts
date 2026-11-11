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

export function createOtpStyles(layout: AuthSignupLayout) {
  const sectionGap = Math.round(Math.max(20, 24 * layout.scale));

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
      minHeight: layout.height,
    },
    header: {
      backgroundColor: 'transparent',
      overflow: 'visible',
      paddingBottom: 4,
    },
    cardSheet: {
      flexGrow: 1,
      marginBottom: 0,
    },
    cardContent: {
      flexGrow: 1,
    },
    titleBlock: {
      alignItems: 'center',
      marginBottom: sectionGap,
    },
    title: {
      color: '#151515',
      fontSize: layout.isSmall ? 18 : 20,
      lineHeight: layout.isSmall ? 24 : 28,
      fontFamily: 'Inter_700Bold',
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      lineHeight: layout.isSmall ? 18 : 22,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      letterSpacing: -0.24,
      maxWidth: '100%',
      paddingHorizontal: 4,
    },
    subtitleEmail: {
      fontFamily: 'Inter_600SemiBold',
    },
    form: {
      alignItems: 'center',
      gap: sectionGap,
    },
    resendBlock: {
      alignItems: 'center',
      gap: 6,
    },
    resendRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    resendPrompt: {
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      letterSpacing: -0.24,
      fontFamily: 'Inter_400Regular',
    },
    resendLink: {
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      letterSpacing: -0.24,
      fontFamily: 'Inter_700Bold',
    },
    resendLinkDisabled: {
      opacity: 0.45,
    },
    resendTimer: {
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      letterSpacing: -0.24,
      fontFamily: 'Inter_400Regular',
    },
    submitButton: {
      marginTop: 4,
      width: '100%',
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
  });
}
