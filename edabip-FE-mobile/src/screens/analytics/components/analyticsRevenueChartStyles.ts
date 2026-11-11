import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const revenueChartLayout = {
  max: 100,
  yTicks: [100, 75, 50, 25, 0] as number[],
  plotHeight: 175,
  xLabelHeight: 20,
  pad: { top: 14, right: 12, bottom: 8, left: 14 },
  xInsetStart: 0,
  xInsetEnd: 0,
  axisColor: '#9CA3AF',
  gridColor: '#CBD5E1',
  lineColor: '#134B4A',
  fillStart: '#B4FFFD',
  fillEnd: '#708C8C',
  dotColor: '#3E9593',
  dotBorderColor: '#134B4A',
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function revenueCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function revenueYLabelOffset(y: number): TextStyle {
  return { top: y - 6 };
}

export function revenueXLabelOffset(x: number): TextStyle {
  return { left: x - 14 };
}

export const analyticsRevenueChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yTitleCol: {
    width: 16,
    height: revenueChartLayout.plotHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yTitle: {
    width: 90,
    fontSize: 8.5,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  yLabelCol: {
    width: 38,
    height: revenueChartLayout.plotHeight,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    right: 6,
    width: 32,
    fontSize: 8.5,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'right',
  },
  plot: { flex: 1 },
  canvas: {
    position: 'relative',
    height: revenueChartLayout.plotHeight + revenueChartLayout.xLabelHeight,
  },
  xLabel: {
    position: 'absolute',
    top: revenueChartLayout.plotHeight + 3,
    width: 28,
    fontSize: 8.5,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
  xAxisTitle: {
    fontSize: 8.5,
    lineHeight: 11,
    textTransform: 'none',
    letterSpacing: 0,
    marginTop: 2,
  },
});
