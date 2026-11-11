import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const keyMatrixCardStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: {
    flexGrow: 1,
    flexBasis: 140,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 6,
  },
  label: { flex: 1, fontSize: 12, lineHeight: 16 },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  changeUp: { backgroundColor: '#F2FFF0' },
  changeDown: { backgroundColor: 'rgba(221,45,48,0.08)' },
  changeLabel: { fontSize: 9, lineHeight: 11, color: '#000' },
  body: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  value: { fontSize: 18, lineHeight: 22 },
  spark: { width: 72, height: 24 },
});
