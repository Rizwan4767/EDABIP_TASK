import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const demandChartLayout = {
  max: 100000,
  yTicks: [100000, 75000, 50000, 25000, 0] as number[],
  plotHeight: 168,
  xLabelHeight: 16,
  pad: { top: 18, right: 8, bottom: 4, left: 6 },
  axisColor: '#9CA3AF',
  gridColor: '#D1D5DB',
  barRatio: 0.42,
  minBarWidth: 10,
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function demandCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function demandYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function demandValueOffset(centerX: number, y: number): TextStyle {
  return { left: centerX - 18, top: y - 12 };
}

export function demandXLabelOffset(centerX: number): TextStyle {
  return { left: centerX - 14 };
}

export const demandPredictionChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabelCol: {
    width: 34,
    height: demandChartLayout.plotHeight,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 4,
    width: 30,
    fontSize: 8,
    lineHeight: 10,
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
    width: 36,
    fontSize: 7,
    lineHeight: 9,
    textTransform: 'none',
    letterSpacing: 0,
    color: 'rgba(20,21,22,0.8)',
    textAlign: 'center',
  },
  xLabel: {
    position: 'absolute',
    top: demandChartLayout.plotHeight,
    width: 28,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
