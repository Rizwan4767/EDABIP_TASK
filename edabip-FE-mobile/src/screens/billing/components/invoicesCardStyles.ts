import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const invoicesCardStyles = StyleSheet.create({
  card: { borderRadius: 4, borderWidth: 1, borderColor: '#CFC9C9', padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flex: 1, fontSize: 16, lineHeight: 20 },
  viewAll: { fontSize: 12, lineHeight: 16, color: '#4A5565' },
  list: { gap: 12 },
  row: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CFC9C9',
    borderRadius: 2,
    padding: 8,
    gap: 8,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  number: { flex: 1, fontSize: 12, lineHeight: 16, color: '#134B4A' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, lineHeight: 16, color: '#535353' },
  paid: {
    backgroundColor: '#ABF2E8',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  paidLabel: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#000',
  },
});
