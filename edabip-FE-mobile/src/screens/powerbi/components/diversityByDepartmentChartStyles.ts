import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

export const diversityChartLayout = {
  max: 100000,
  yTicks: [100000, 75000, 50000, 25000, 0] as number[],
  plotHeight: 168,
  xLabelHeight: 18,
  pad: { top: 18, right: 8, bottom: 4, left: 6 },
  axisColor: '#9CA3AF',
  gridColor: '#D1D5DB',
  barRatio: 0.38,
  minBarWidth: 18,
  barRadius: 6,
} as const;

export function chartCardFill(backgroundColor: string, borderColor: string): ViewStyle {
  return { backgroundColor, borderColor };
}

export function diversityCanvasWidth(width: number): ViewStyle {
  return { width };
}

export function diversityYLabelOffset(y: number): TextStyle {
  return { top: y - 5 };
}

export function diversityValueOffset(centerX: number, y: number): TextStyle {
  return { left: centerX - 18, top: y - 12 };
}

export function diversityXLabelOffset(centerX: number, slot: number): TextStyle {
  const width = Math.max(56, slot);
  return { left: centerX - width / 2, width };
}

export function diversityStackPos(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): ViewStyle {
  return {
    left: x,
    top: y,
    width,
    height,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  };
}

export function diversityCapHeight(height: number): ViewStyle {
  return { height };
}

export const diversityByDepartmentChartStyles = StyleSheet.create({
  card: { borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 12, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, lineHeight: 20, flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabelCol: {
    width: 34,
    height: diversityChartLayout.plotHeight,
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
    height: diversityChartLayout.plotHeight + diversityChartLayout.xLabelHeight,
  },
  stack: {
    position: 'absolute',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  cap: { width: '100%' },
  fill: { flex: 1, width: '100%' },
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
    top: diversityChartLayout.plotHeight,
    fontSize: 8,
    lineHeight: 10,
    textTransform: 'none',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
