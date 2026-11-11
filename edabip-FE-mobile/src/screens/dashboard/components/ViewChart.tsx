import { View } from 'react-native';

import {
  axisHorizontal,
  axisVertical,
  chartAxis,
  chartBarPos,
  chartDotPos,
  chartStemPos,
  dashPiece,
  dashedTrack,
  gridLinePos,
  plotBox,
  polylineSegment,
  viewChartStyles as styles,
  xTickMark,
  yTickMark,
} from '@/screens/dashboard/components/viewChartStyles';

export function ChartGrid({
  width,
  height,
  padTop,
  padLeft,
  plotW,
  plotH,
  ticks,
  max,
  color,
}: Readonly<{
  width: number;
  height: number;
  padTop: number;
  padLeft: number;
  plotW: number;
  plotH: number;
  ticks: number[];
  max: number;
  color: string;
}>) {
  return (
    <View style={plotBox(width, height)}>
      {ticks.map((tick) => {
        const y = padTop + (1 - tick / max) * plotH;
        return <View key={tick} style={[styles.gridLine, gridLinePos(y, padLeft, plotW, color)]} />;
      })}
    </View>
  );
}

export function ChartPolyline({
  points,
  color,
}: Readonly<{
  points: { x: number; y: number }[];
  color: string;
}>) {
  return (
    <>
      {points.slice(0, -1).map((start, index) => {
        const end = points[index + 1];
        if (!end) return null;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={`${start.x}-${start.y}-${end.x}-${end.y}`}
            style={[styles.segment, polylineSegment(start.x, start.y, length, color, angle)]}
          />
        );
      })}
    </>
  );
}

export function ChartDot({
  x,
  y,
  size,
  color,
  fill,
}: Readonly<{
  x: number;
  y: number;
  size: number;
  color: string;
  fill: string;
}>) {
  return <View style={[styles.dot, chartDotPos(x, y, size, color, fill)]} />;
}

export function ChartStem({
  x,
  y,
  baseline,
  color,
}: Readonly<{
  x: number;
  y: number;
  baseline: number;
  color: string;
}>) {
  return <View style={[styles.stem, chartStemPos(x, y, Math.max(0, baseline - y), color)]} />;
}

export function ChartBar({
  x,
  y,
  width,
  height,
  color,
  radius = 3,
}: Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  radius?: number;
}>) {
  return (
    <View style={[styles.bar, chartBarPos(x, y, width, Math.max(0, height), color, radius)]} />
  );
}

function DashedLine({
  left,
  top,
  length,
  color,
  vertical = false,
}: Readonly<{
  left: number;
  top: number;
  length: number;
  color: string;
  vertical?: boolean;
}>) {
  const count = Math.max(1, Math.floor(length / (chartAxis.dash + chartAxis.gap)));

  return (
    <View
      style={[vertical ? styles.dashCol : styles.dashRow, dashedTrack(vertical, left, top, length)]}
    >
      {Array.from({ length: count }, (_, offset) => (
        <View
          key={`dash-${left}-${top}-${offset * (chartAxis.dash + chartAxis.gap)}`}
          style={dashPiece(vertical, color)}
        />
      ))}
    </View>
  );
}

/**
 * Solid X/Y axes, tick marks, and dashed grid — matches the Figma analytics
 * charts. Horizontal grid skips 0 because the X-axis is the baseline.
 */
export function ChartPlotFrame({
  width,
  height,
  padTop,
  padLeft,
  plotW,
  plotH,
  yTicks,
  max,
  xPositions,
  axisColor,
  gridColor,
  verticalGrid = false,
  xTicks = false,
}: Readonly<{
  width: number;
  height: number;
  padTop: number;
  padLeft: number;
  plotW: number;
  plotH: number;
  yTicks: number[];
  max: number;
  xPositions: number[];
  axisColor: string;
  gridColor: string;
  verticalGrid?: boolean;
  xTicks?: boolean;
}>) {
  const xAxisY = padTop + plotH;

  return (
    <View pointerEvents="none" style={plotBox(width, height)}>
      {yTicks
        .filter((tick) => tick !== 0)
        .map((tick) => {
          const y = padTop + (1 - tick / max) * plotH;
          return (
            <DashedLine key={`h-${tick}`} left={padLeft} top={y} length={plotW} color={gridColor} />
          );
        })}

      {verticalGrid
        ? xPositions.map((x) => (
            <DashedLine
              key={`v-${x}`}
              left={x}
              top={padTop}
              length={plotH}
              color={gridColor}
              vertical
            />
          ))
        : null}

      <View style={[styles.axisLine, axisVertical(padLeft, padTop, plotH, axisColor)]} />
      <View style={[styles.axisLine, axisHorizontal(padLeft, xAxisY, plotW, axisColor)]} />

      {yTicks.map((tick) => {
        const y = padTop + (1 - tick / max) * plotH;
        return (
          <View
            key={`yt-${tick}`}
            style={[styles.tick, yTickMark(padLeft - chartAxis.tickLen, y, axisColor)]}
          />
        );
      })}

      {xTicks
        ? xPositions.map((x) => (
            <View key={`xt-${x}`} style={[styles.tick, xTickMark(x, xAxisY, axisColor)]} />
          ))
        : null}
    </View>
  );
}
