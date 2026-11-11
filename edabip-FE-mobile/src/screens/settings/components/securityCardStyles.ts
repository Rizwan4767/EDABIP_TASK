import { StyleSheet } from 'react-native';

export const securityCardStyles = StyleSheet.create({
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEC',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { flex: 1, fontSize: 14, lineHeight: 20, color: '#111111' },
});
