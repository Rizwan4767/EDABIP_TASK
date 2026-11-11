import { StyleSheet } from 'react-native';

import { palette } from '@/theme/colors';

export const authMobileHeroStyles = StyleSheet.create({
  wrap: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  logoRow: {
    zIndex: 3,
  },
  carousel: {
    position: 'relative',
    overflow: 'hidden',
    zIndex: 1,
    justifyContent: 'space-between',
  },
  copySlot: {
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  copy: {
    zIndex: 2,
  },
  title: {
    color: palette.white,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  description: {
    color: palette.white,
    fontFamily: 'Inter_400Regular',
  },
  hand: {
    position: 'absolute',
    zIndex: 2,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: palette.white,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#D69808',
  },
});
