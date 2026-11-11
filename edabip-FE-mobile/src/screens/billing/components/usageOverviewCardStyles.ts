import { StyleSheet, type ViewStyle } from 'react-native';

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function usageFill(widthPercent: number): ViewStyle {
  return { width: `${Math.max(0, Math.min(100, widthPercent))}%` };
}

export const usageOverviewCardStyles = StyleSheet.create({
  card: { borderRadius: 4, borderWidth: 1, borderColor: '#CFC9C9', padding: 12, gap: 16 },
  title: { fontSize: 16, lineHeight: 22 },
  list: { gap: 16 },
  row: { gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 12, lineHeight: 16 },
  percent: { fontSize: 12, lineHeight: 16 },
  track: {
    height: 8,
    borderRadius: 150,
    backgroundColor: '#D9D9D9',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 150, backgroundColor: '#134B4A' },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  meta: { flex: 1, fontSize: 11, lineHeight: 14, color: '#000' },
  limit: { fontSize: 11, lineHeight: 14, color: '#000' },
});
