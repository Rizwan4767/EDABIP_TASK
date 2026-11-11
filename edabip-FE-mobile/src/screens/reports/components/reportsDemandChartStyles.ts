import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const demandChartLayout = {
  max: 100000,
  yTicks: [100000, 75000, 50000, 25000, 0] as number[],
  plotHeight: 180,
  xLabelHeight: 20,
  pad: { top: 16, right: 12, bottom: 4, left: 6 },
  axisColor: '#9CA3AF',
  gridColor: '#EDEDED',
  barRatio: 0.52,
  minBarWidth: 26,
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function demandCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function demandYLabelOffset(y: number): TextStyle {
  return { top: y - 6 };
}

export function demandValueOffset(centerX: number, y: number): TextStyle {
  return { left: centerX - 24, top: y - 18 };
}

export function demandXLabelOffset(centerX: number): TextStyle {
  return { left: centerX - 18 };
}

export const reportsDemandChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, lineHeight: 22, fontWeight: '700', flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yAxisTitleWrap: {
    width: 16,
    height: demandChartLayout.plotHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yAxisTitle: {
    transform: [{ rotate: '-90deg' }],
    width: 90,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'none',
    letterSpacing: 0,
  },
  yLabelCol: { width: 38, height: demandChartLayout.plotHeight, position: 'relative' },
  yLabel: {
    position: 'absolute',
    right: 4,
    width: 36,
    fontSize: 10,
    lineHeight: 13,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: demandChartLayout.plotHeight + demandChartLayout.xLabelHeight,
  },
  value: {
    position: 'absolute',
    width: 48,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    textTransform: 'none',
    letterSpacing: 0,
  },
  xLabel: {
    position: 'absolute',
    top: demandChartLayout.plotHeight + 4,
    width: 36,
    fontSize: 12,
    lineHeight: 15,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
