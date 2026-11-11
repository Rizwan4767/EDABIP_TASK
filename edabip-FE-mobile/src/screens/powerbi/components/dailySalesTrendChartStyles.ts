import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const dailyTrendLayout = {
  plotHeight: 140,
  xLabelHeight: 18,
  pad: { top: 8, right: 10, bottom: 8, left: 4 },
  xInsetStart: 10,
  xInsetEnd: 10,
  axisColor: '#9AA3AB',
  gridColor: '#E5E7EB',
  currentColor: '#134B4A',
  previousColor: '#53BDBB',
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function trendCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function trendYLabelOffset(y: number): TextStyle {
  return { top: y - 6 };
}

export function trendXLabelOffset(x: number): TextStyle {
  return { left: x - 16 };
}

export const dailySalesTrendChartStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, lineHeight: 22, fontWeight: '600', color: '#111827', flex: 1 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterLabel: { fontSize: 12, lineHeight: 14, color: '#134B4A' },
  filterOption: { paddingVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yTitleCol: {
    width: 16,
    height: dailyTrendLayout.plotHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yTitle: {
    width: 72,
    fontSize: 9,
    lineHeight: 12,
    color: '#9AA3AB',
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  yLabelCol: {
    width: 36,
    height: dailyTrendLayout.plotHeight,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 4,
    width: 34,
    fontSize: 9,
    lineHeight: 12,
    color: '#9AA3AB',
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: dailyTrendLayout.plotHeight + dailyTrendLayout.xLabelHeight,
  },
  empty: {
    flex: 1,
    minHeight: dailyTrendLayout.plotHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  xLabel: {
    position: 'absolute',
    top: dailyTrendLayout.plotHeight + 4,
    width: 34,
    fontSize: 9,
    lineHeight: 12,
    color: '#9AA3AB',
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  footer: {
    gap: 8,
    marginTop: 4,
  },
  xAxisTitleRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  xAxisTitle: {
    fontSize: 10,
    lineHeight: 14,
    color: '#9AA3AB',
    fontWeight: '500',
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.2,
    backgroundColor: 'transparent',
  },
  legendLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    textTransform: 'none',
    letterSpacing: 0,
  },
});
