import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import {
  revenueForecastCanvasWidth,
  revenueForecastChartLayout,
  revenueForecastChartStyles as styles,
  revenueForecastXLabelOffset,
  revenueForecastYLabelOffset,
} from '@/screens/dashboard/components/revenueForecastChartStyles';
import type { RevenuePoint } from '@/screens/dashboard/dashboardData';

const MAX_REVENUE = 100;

/** Cubic Bézier smooth curve — identical to web DashboardCharts.jsx */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  const pStart = points[0];
  if (!pStart || points.length < 2) return '';
  let d = `M ${pStart.x} ${pStart.y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    if (!p0 || !p1) continue;
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function formatTick(value: number): string {
  return value === 0 ? '0' : `$${value}K`;
}

export function RevenueForecastChart({ points }: Readonly<{ points: RevenuePoint[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(240);
  const { pad, plotHeight, yTicks, axisColor, gridColor, lineColor, dotColor, dotBorderColor } =
    revenueForecastChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const baseline = pad.top + plotH;

  // First dot starts directly at x = pad.left (0 on plot), last at pad.left + plotW
  const plotted = points.map((point, index) => {
    const x = pad.left + (index / Math.max(points.length - 1, 1)) * plotW;
    const y = pad.top + (1 - point.value / MAX_REVENUE) * plotH;
    return { ...point, x, y };
  });

  const smoothPath = buildSmoothPath(plotted);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <AppText variant="h3">Revenue Forecast</AppText>

      <View style={styles.row}>
        {/* Rotated Y-axis title */}
        <View style={styles.yTitleCol}>
          <AppText variant="overline" color="textMuted" style={styles.yTitle}>
            Revenue (USD)
          </AppText>
        </View>

        {/* Y-axis tick labels */}
        <View style={styles.yLabelCol}>
          {yTicks.map((tick) => {
            const y = pad.top + (1 - tick / MAX_REVENUE) * plotH;
            return (
              <AppText
                key={tick}
                variant="overline"
                color="textMuted"
                style={[styles.yLabel, revenueForecastYLabelOffset(y)]}
              >
                {formatTick(tick)}
              </AppText>
            );
          })}
        </View>

        {/* Plot area */}
        <View
          style={styles.plot}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.width);
            if (next > 0 && next !== plotWidth) setPlotWidth(next);
          }}
        >
          <View style={[styles.canvas, revenueForecastCanvasWidth(plotWidth)]}>
            <Svg width={plotWidth} height={plotHeight}>
              {/* Horizontal dashed grid lines */}
              {yTicks
                .filter((tick) => tick !== 0)
                .map((tick) => {
                  const y = pad.top + (1 - tick / MAX_REVENUE) * plotH;
                  return (
                    <Line
                      key={`h-${tick}`}
                      x1={pad.left}
                      y1={y}
                      x2={pad.left + plotW}
                      y2={y}
                      stroke={gridColor}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                    />
                  );
                })}

              {/* Vertical dashed grid lines */}
              {plotted.map((p) => (
                <Line
                  key={`v-${p.month}`}
                  x1={p.x}
                  y1={pad.top}
                  x2={p.x}
                  y2={baseline}
                  stroke={gridColor}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ))}

              {/* Solid vertical Y-axis line on left */}
              <Line
                x1={pad.left}
                y1={pad.top}
                x2={pad.left}
                y2={baseline}
                stroke={axisColor}
                strokeWidth={1}
              />

              {/* Small tick marks on vertical Y-axis line */}
              {yTicks.map((tick) => {
                const y = pad.top + (1 - tick / MAX_REVENUE) * plotH;
                return (
                  <Line
                    key={`ytick-${tick}`}
                    x1={pad.left - 4}
                    y1={y}
                    x2={pad.left}
                    y2={y}
                    stroke={axisColor}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Solid horizontal X-axis line at bottom */}
              <Line
                x1={pad.left}
                y1={baseline}
                x2={pad.left + plotW}
                y2={baseline}
                stroke={axisColor}
                strokeWidth={1}
              />

              {/* Smooth Bézier curve */}
              <Path
                d={smoothPath}
                fill="none"
                stroke={lineColor}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Small delicate dots matching Figma */}
              {plotted.map((p) => (
                <Circle
                  key={`dot-${p.month}`}
                  cx={p.x}
                  cy={p.y}
                  r={2.4}
                  fill={dotColor}
                  stroke={dotBorderColor}
                  strokeWidth={1}
                />
              ))}
            </Svg>

            {/* X-axis labels */}
            {plotted.map((point) => (
              <AppText
                key={`${point.month}-x`}
                variant="overline"
                color="textMuted"
                style={[styles.xLabel, revenueForecastXLabelOffset(point.x)]}
              >
                {point.month}
              </AppText>
            ))}
          </View>
        </View>
      </View>

      <AppText variant="overline" color="textMuted" align="center" style={styles.xAxisTitle}>
        Month
      </AppText>
    </View>
  );
}
