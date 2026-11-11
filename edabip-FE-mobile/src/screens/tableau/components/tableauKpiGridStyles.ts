import { StyleSheet, type ViewStyle } from 'react-native';

export function kpiCardFill(backgroundColor: string): ViewStyle {
  return { backgroundColor };
}

export const tableauKpiGridStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 108,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFC9C9',
    padding: 12,
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 13, lineHeight: 17 },
  value: { fontSize: 18, lineHeight: 22 },
  changeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  change: { fontSize: 11, lineHeight: 14 },
  note: { fontSize: 8, lineHeight: 10, textTransform: 'none', letterSpacing: 0 },
  skeleton: { gap: 8 },
});
