import { Platform, StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

const cardShadow =
  Platform.OS === 'web'
    ? { boxShadow: '0 6px 10px rgba(0,0,0,0.1)' }
    : {
        shadowColor: palette.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
      };

export const authCurvedSheetStyles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
    overflow: 'visible',
    ...cardShadow,
  },
  containerFill: {
    marginBottom: 0,
    flexGrow: 1,
    flex: 1,
  },
  capClip: {
    width: '100%',
    overflow: 'hidden',
  },
  capImage: {
    position: 'absolute',
  },
  body: {
    backgroundColor: palette.white,
    paddingTop: 20,
    paddingBottom: 28,
  },
  bodyOtp: {
    paddingTop: 28,
    paddingBottom: 40,
  },
  bodyForgotPassword: {
    paddingTop: 28,
    paddingBottom: 40,
  },
});
