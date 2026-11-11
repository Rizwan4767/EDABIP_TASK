import { StyleSheet, type ViewStyle } from 'react-native';

export const categoryDonutLayout = {
  size: 168,
  viewBox: '0 0 296.707 296.707',
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export const revenueCategoryChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  chart: {
    width: categoryDonutLayout.size,
    height: categoryDonutLayout.size,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  legend: { flex: 1, gap: 10 },
  item: { gap: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 11, height: 11, borderRadius: 6 },
  name: { fontSize: 12, lineHeight: 16, color: '#9CA3AF' },
  value: {
    paddingLeft: 17,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    color: '#111827',
  },
});
