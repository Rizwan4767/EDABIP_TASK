import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const monthlyChartLayout = {
  plotHeight: 156,
  xLabelHeight: 16,
  pad: { top: 22, right: 4, bottom: 6, left: 4 },
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  barWidth: 24,
  stripe: '#C9B8F2',
  stripeBg: '#EFE9FC',
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function monthlyCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function monthlyYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function monthlyXLabelOffset(centerX: number): TextStyle {
  return { left: centerX - 14 };
}

export function monthlyValueOffset(centerX: number, y: number): TextStyle {
  return { left: centerX - 20, top: y - 14 };
}

export const monthlyRevenueChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabelCol: {
    width: 36,
    height: monthlyChartLayout.plotHeight,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 4,
    width: 32,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1, overflow: 'visible' },
  canvas: {
    position: 'relative',
    height: monthlyChartLayout.plotHeight + monthlyChartLayout.xLabelHeight,
    overflow: 'visible',
    zIndex: 1,
  },
  empty: {
    flex: 1,
    minHeight: monthlyChartLayout.plotHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  value: {
    position: 'absolute',
    width: 40,
    fontSize: 7,
    lineHeight: 9,
    textTransform: 'none',
    letterSpacing: 0,
    color: '#111827',
    textAlign: 'center',
  },
  xLabel: {
    position: 'absolute',
    top: monthlyChartLayout.plotHeight,
    width: 28,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
