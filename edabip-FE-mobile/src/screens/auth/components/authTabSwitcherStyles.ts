import { Platform, StyleSheet } from 'react-native';

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

export const authTabSwitcherStyles = StyleSheet.create({
  container: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 4,
    marginBottom: 14,
    backgroundColor: palette.white,
    borderRadius: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(19, 75, 74, 0.15)',
    overflow: 'hidden',
    ...softShadow,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    width: '55%',
    height: '100%',
    backgroundColor: palette.teal700,
    borderRadius: 100,
  },
  activePillSignup: {
    left: 0,
  },
  activePillLogin: {
    right: 0,
  },
  tab: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  tabText: {
    fontFamily: 'Inter_400Regular',
  },
  tabTextActive: {
    color: palette.white,
  },
  tabTextLogin: {
    color: palette.black,
  },
});
