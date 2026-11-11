import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const trendChartLayout = {
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
  dotColor: '#134B4A',
  dotBorderColor: '#134B4A',
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
  return { left: x - 14 };
}

export const trendAnalysisChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yTitleCol: {
    width: 16,
    height: trendChartLayout.plotHeight,
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
    height: trendChartLayout.plotHeight,
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
    height: trendChartLayout.plotHeight + trendChartLayout.xLabelHeight,
  },
  xLabel: {
    position: 'absolute',
    top: trendChartLayout.plotHeight + 3,
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
