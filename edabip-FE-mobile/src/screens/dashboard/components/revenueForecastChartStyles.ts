import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const revenueForecastChartLayout = {
  max: 100,
  yTicks: [100, 75, 50, 25, 0] as number[],
  plotHeight: 140,
  xLabelHeight: 18,
  pad: { top: 12, right: 10, bottom: 8, left: 12 },
  xInsetStart: 0,
  xInsetEnd: 0,
  axisColor: '#9CA3AF',
  gridColor: '#E5E7EB',
  lineColor: '#134B4A',
  dotColor: '#3E9593',
  dotBorderColor: '#134B4A',
} as const;

export function revenueForecastYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function revenueForecastXLabelOffset(x: number): TextStyle {
  return { left: x - 14 };
}

export function revenueForecastCanvasWidth(width: number): ViewStyle {
  return { width };
}

export const revenueForecastChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yTitleCol: {
    width: 16,
    height: revenueForecastChartLayout.plotHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yTitle: {
    width: 80,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  yLabelCol: {
    width: 36,
    height: revenueForecastChartLayout.plotHeight,
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
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: revenueForecastChartLayout.plotHeight + revenueForecastChartLayout.xLabelHeight,
  },
  xLabel: {
    position: 'absolute',
    top: revenueForecastChartLayout.plotHeight + 2,
    width: 28,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  xAxisTitle: {
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: 2,
  },
});
