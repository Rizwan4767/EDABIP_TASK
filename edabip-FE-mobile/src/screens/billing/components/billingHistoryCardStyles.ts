import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const billingHistoryLayout = {
  max: 100000,
  yTicks: [100000, 75000, 50000, 25000, 0] as number[],
  plotHeight: 112,
  xLabelHeight: 16,
  pad: { top: 4, right: 4, bottom: 4, left: 4 },
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  barWidth: 14,
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function historyCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function historyYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function historyXLabelOffset(centerX: number): TextStyle {
  return { left: centerX - 12 };
}

export const billingHistoryCardStyles = StyleSheet.create({
  card: { borderRadius: 4, borderWidth: 1, borderColor: '#CFC9C9', padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flex: 1, fontSize: 16, lineHeight: 20 },
  viewAll: { fontSize: 12, lineHeight: 16, color: '#4A5565' },
  body: { flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  stats: { width: 99, justifyContent: 'space-between', gap: 16 },
  stat: { gap: 2, borderLeftWidth: 1, borderLeftColor: '#CFC9C9', paddingLeft: 6 },
  statLabel: { fontSize: 10, lineHeight: 12, color: '#535353' },
  statValue: { fontSize: 12, lineHeight: 16 },
  chart: { flex: 1 },
  plotRow: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabelCol: { width: 36, height: billingHistoryLayout.plotHeight, position: 'relative' },
  yLabel: {
    position: 'absolute',
    right: 2,
    width: 34,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: billingHistoryLayout.plotHeight + billingHistoryLayout.xLabelHeight,
    overflow: 'visible',
  },
  xLabel: {
    position: 'absolute',
    top: billingHistoryLayout.plotHeight,
    width: 24,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
