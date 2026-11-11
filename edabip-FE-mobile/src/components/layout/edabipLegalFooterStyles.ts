import { StyleSheet } from 'react-native';

export const edabipLegalFooterStyles = StyleSheet.create({
  footer: { gap: 4, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  text: {
    fontSize: 8,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#A2A2A2',
  },
});
