import { Platform, StyleSheet } from 'react-native';

import type { AuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';
import { palette } from '@/theme/colors';

const successGlow =
  Platform.OS === 'web'
    ? { boxShadow: '0 10px 24px rgba(32, 216, 222, 0.35), 0 4px 12px rgba(6, 34, 40, 0.28)' }
    : {
        shadowColor: '#20D8DE',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
      };

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

export function createPasswordResetSuccessStyles(layout: AuthSignupLayout) {
  const successIconSize = Math.round(Math.min(116, Math.max(96, 108 * layout.scale)));

  return StyleSheet.create({
    root: {
      flex: 1,
    },
    safe: {
      flex: 1,
      backgroundColor: 'transparent',
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
      alignItems: 'center',
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
    successIconWrap: {
      width: successIconSize,
      height: successIconSize,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: Math.round(4 * layout.scale),
      ...successGlow,
    },
    successIcon: {
      width: successIconSize,
      height: successIconSize,
    },
    submitButton: {
      width: '100%',
      height: layout.fieldHeight,
      borderRadius: 100,
      backgroundColor: palette.teal700,
      alignItems: 'center',
      justifyContent: 'center',
      ...softShadow,
    },
    submitLabel: {
      color: palette.white,
      fontSize: layout.fontSize,
      fontFamily: 'Inter_400Regular',
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    footerText: {
      textAlign: 'center',
      color: '#151515',
      fontSize: layout.isSmall ? 11 : 12,
      letterSpacing: -0.36,
      fontFamily: 'Inter_400Regular',
    },
    footerLink: {
      color: palette.teal700,
      fontSize: layout.fontSize,
      fontFamily: 'Inter_600SemiBold',
    },
    socialRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
      marginTop: Math.round(4 * layout.scale),
    },
    socialButton: {
      width: 32,
      height: 32,
      borderWidth: 1,
      borderColor: palette.teal700,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.white,
    },
  });
}
