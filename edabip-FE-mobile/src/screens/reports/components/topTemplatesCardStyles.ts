import { StyleSheet } from 'react-native';

export const topTemplatesCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    padding: 10,
  },
  copy: { flex: 1, gap: 2 },
  when: { fontSize: 11, lineHeight: 14, textTransform: 'none', letterSpacing: 0 },
  useButton: {
    minWidth: 54,
    height: 26,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  useLabel: { fontSize: 12, lineHeight: 15 },
});
