import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const paymentMethodCardStyles = StyleSheet.create({
  card: { borderRadius: 4, borderWidth: 1, borderColor: '#CFC9C9', padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flex: 1, fontSize: 16, lineHeight: 20 },
  viewAll: { fontSize: 12, lineHeight: 16, color: '#4A5565' },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CFC9C9',
    borderRadius: 2,
    padding: 8,
  },
  copy: { flex: 1, gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 12, lineHeight: 16, color: '#134B4A' },
  expiry: { fontSize: 10, lineHeight: 12, color: '#535353' },
  primary: {
    backgroundColor: '#ABF2E8',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  primaryLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
  addButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: '#134B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: { fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
});
