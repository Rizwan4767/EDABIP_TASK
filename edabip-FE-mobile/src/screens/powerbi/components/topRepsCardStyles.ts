import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const topRepsCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1 },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllLabel: {
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#111827',
  },
  list: { gap: 8 },
  row: {
    borderWidth: 1,
    borderColor: '#EDE9FE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 48,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  col: { gap: 4 },
  revenueCol: { alignItems: 'flex-end', minWidth: 80 },
  label: {
    fontSize: 10,
    lineHeight: 14,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#6B7280',
  },
  value: { fontSize: 12, lineHeight: 14 },
});
