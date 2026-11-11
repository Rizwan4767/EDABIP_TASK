import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  chartCardFill,
  trendAnalysisChartStyles as styles,
  trendCanvasWidth,
  trendChartLayout,
  trendXLabelOffset,
  trendYLabelOffset,
} from '@/screens/tableau/components/trendAnalysisChartStyles';
import type { TableauTrendPoint } from '@/screens/tableau/tableauData';

function formatTick(value: number): string {
  return value === 0 ? '0' : `$${value}K`;
}

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

export function TrendAnalysisChart({ points }: Readonly<{ points: TableauTrendPoint[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(240);
  const {
    pad,
    plotHeight,
    max,
    yTicks,
    axisColor,
    gridColor,
    lineColor,
    fillStart,
    fillEnd,
    dotColor,
    dotBorderColor,
  } = trendChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const baseline = pad.top + plotH;

  // Dot starts directly on Y-axis (x = pad.left) and ends at pad.left + plotW
  const plotted = points.map((point, index) => {
    const x = pad.left + (index / Math.max(points.length - 1, 1)) * plotW;
    const y = pad.top + (1 - point.value / max) * plotH;
    return { ...point, x, y };
  });

  const linePath = buildSmoothPath(plotted);
  const lastX = pad.left + plotW;
  const firstX = pad.left;
  const areaPath = linePath ? `${linePath} L ${lastX} ${baseline} L ${firstX} ${baseline} Z` : '';

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Trend Analysis - Revenue Over Time
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Trend analysis actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      <View style={styles.row}>
        {/* Rotated Y-axis title on the left */}
        <View style={styles.yTitleCol}>
          <AppText variant="overline" color="textMuted" style={styles.yTitle}>
            Revenue (USD)
          </AppText>
        </View>

        {/* Y-axis tick labels */}
        <View style={styles.yLabelCol}>
          {yTicks.map((tick) => {
            const y = pad.top + (1 - tick / max) * plotH;
            return (
              <AppText
                key={tick}
                variant="overline"
                color="textMuted"
                style={[styles.yLabel, trendYLabelOffset(y)]}
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
          <View style={[styles.canvas, trendCanvasWidth(plotWidth)]}>
            <Svg width={plotWidth} height={plotHeight}>
              <Defs>
                {/* Two-tone cyan-to-slate gradient matching Figma Image 1 */}
                <LinearGradient id="tbTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={fillStart} stopOpacity={0.95} />
                  <Stop offset="100%" stopColor={fillEnd} stopOpacity={0.92} />
                </LinearGradient>
              </Defs>

              {/* 1. Gradient area fill rendered in background */}
              {areaPath ? <Path d={areaPath} fill="url(#tbTrendFill)" /> : null}

              {/* 2. Horizontal dashed grid lines (rendered on top of area fill so they are clearly visible!) */}
              {yTicks
                .filter((tick) => tick !== 0)
                .map((tick) => {
                  const y = pad.top + (1 - tick / max) * plotH;
                  return (
                    <Line
                      key={`grid-${tick}`}
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

              {/* 3. Vertical dashed grid lines */}
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

              {/* 4. Solid vertical Y-axis line on left */}
              <Line
                x1={pad.left}
                y1={pad.top}
                x2={pad.left}
                y2={baseline}
                stroke={axisColor}
                strokeWidth={1}
              />

              {/* 5. Small tick marks on vertical Y-axis line */}
              {yTicks.map((tick) => {
                const y = pad.top + (1 - tick / max) * plotH;
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

              {/* 6. Solid horizontal X-axis line at bottom */}
              <Line
                x1={pad.left}
                y1={baseline}
                x2={pad.left + plotW}
                y2={baseline}
                stroke={axisColor}
                strokeWidth={1}
              />

              {/* 7. Smooth Bézier curve */}
              {linePath ? (
                <Path
                  d={linePath}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {/* 8. Dots: dark teal #134B4A matching Figma Image 1 */}
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
                style={[styles.xLabel, trendXLabelOffset(point.x)]}
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
