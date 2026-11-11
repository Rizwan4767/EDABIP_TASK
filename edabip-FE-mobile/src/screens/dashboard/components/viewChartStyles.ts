import { StyleSheet, type ViewStyle } from 'react-native';

export const chartAxis = {
  tickLen: 4,
  thickness: 1,
  dash: 3,
  gap: 2,
} as const;

export function plotBox(width: number, height: number): ViewStyle {
  return { width, height };
}

export function gridLinePos(top: number, left: number, width: number, color: string): ViewStyle {
  return { top, left, width, backgroundColor: color };
}

export function polylineSegment(
  left: number,
  top: number,
  width: number,
  color: string,
  angle: number,
): ViewStyle {
  return {
    left,
    top,
    width,
    backgroundColor: color,
    transform: [{ rotate: `${angle}deg` }],
  };
}

export function chartDotPos(
  x: number,
  y: number,
  size: number,
  color: string,
  fill: string,
): ViewStyle {
  return {
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: fill,
    borderColor: color,
  };
}

export function chartStemPos(x: number, y: number, height: number, color: string): ViewStyle {
  return { left: x - 1, top: y, height, backgroundColor: color };
}

export function chartBarPos(
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  radius: number,
): ViewStyle {
  return {
    left: x,
    top: y,
    width,
    height,
    backgroundColor: color,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
  };
}

export function dashedTrack(
  vertical: boolean,
  left: number,
  top: number,
  length: number,
): ViewStyle {
  return {
    left,
    top,
    width: vertical ? chartAxis.thickness : length,
    height: vertical ? length : chartAxis.thickness,
  };
}

export function dashPiece(vertical: boolean, color: string): ViewStyle {
  return {
    width: vertical ? chartAxis.thickness : chartAxis.dash,
    height: vertical ? chartAxis.dash : chartAxis.thickness,
    marginRight: vertical ? 0 : chartAxis.gap,
    marginBottom: vertical ? chartAxis.gap : 0,
    backgroundColor: color,
  };
}

export function axisVertical(left: number, top: number, height: number, color: string): ViewStyle {
  return {
    left,
    top,
    width: chartAxis.thickness,
    height,
    backgroundColor: color,
  };
}

export function axisHorizontal(left: number, top: number, width: number, color: string): ViewStyle {
  return {
    left,
    top,
    width,
    height: chartAxis.thickness,
    backgroundColor: color,
  };
}

export function yTickMark(left: number, top: number, color: string): ViewStyle {
  return {
    left,
    top,
    width: chartAxis.tickLen,
    height: chartAxis.thickness,
    backgroundColor: color,
  };
}

export function xTickMark(left: number, top: number, color: string): ViewStyle {
  return {
    left,
    top,
    width: chartAxis.thickness,
    height: chartAxis.tickLen,
    backgroundColor: color,
  };
}

export const viewChartStyles = StyleSheet.create({
  gridLine: {
    position: 'absolute',
    height: StyleSheet.hairlineWidth,
    opacity: 0.85,
  },
  segment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    transformOrigin: '0 50%',
  },
  dot: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  stem: {
    position: 'absolute',
    width: 2,
    borderRadius: 1,
  },
  bar: {
    position: 'absolute',
  },
  axisLine: {
    position: 'absolute',
  },
  tick: {
    position: 'absolute',
  },
  dashRow: {
    position: 'absolute',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  dashCol: {
    position: 'absolute',
    flexDirection: 'column',
    overflow: 'hidden',
  },
});
