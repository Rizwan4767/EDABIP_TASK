import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { KebabIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { DailySalesPoint } from '@/screens/powerbi/powerBiData';
import {
  dailyRevenueScale,
  plotY,
  smoothLinePath,
  salesUsdTick,
  uniqueDayLabels,
} from '@/screens/powerbi/salesAnalyticsChart';
import {
  chartCardFill,
  dailySalesTrendChartStyles as styles,
  dailyTrendLayout,
  trendCanvasWidth,
  trendXLabelOffset,
  trendYLabelOffset,
} from '@/screens/powerbi/components/dailySalesTrendChartStyles';

export function DailySalesTrendChart({
  points,
  title = 'Daily Sales Trend',
  yAxisLabel = 'Revenue (USD)',
  xAxisLabel = 'Days',
  currentLabel = 'Current',
  previousLabel = 'Previous',
  showPrevious = true,
  showDots = false,
  showPreviousDots = false,
  showLegend = true,
  showMenu = false,
  hideXAxisTitle = false,
  previousLegendOutline = false,
  headerRight,
  currentColor,
  previousColor,
  scale,
  formatTick = salesUsdTick,
}: Readonly<{
  points: DailySalesPoint[];
  title?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  currentLabel?: string;
  previousLabel?: string;
  showPrevious?: boolean;
  showDots?: boolean;
  showPreviousDots?: boolean;
  showLegend?: boolean;
  showMenu?: boolean;
  hideXAxisTitle?: boolean;
  previousLegendOutline?: boolean;
  headerRight?: ReactNode;
  currentColor?: string;
  previousColor?: string;
  scale?: { max: number; ticks: number[] };
  formatTick?: (value: number) => string;
}>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const { pad, plotHeight, axisColor, gridColor } = dailyTrendLayout;
  const lineCurrentColor = currentColor ?? dailyTrendLayout.currentColor;
  const linePreviousColor = previousColor ?? dailyTrendLayout.previousColor;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const xStart = pad.left + dailyTrendLayout.xInsetStart;
  const xEnd = pad.left + plotW - dailyTrendLayout.xInsetEnd;
  const span = Math.max(1, xEnd - xStart);

  const maxValue = Math.max(
    0,
    ...points.flatMap((point) => [point.current, showPrevious ? point.previous : 0]),
  );
  const { max, ticks } = scale ?? dailyRevenueScale(maxValue);

  const xForIndex = (index: number) => xStart + (index / Math.max(points.length - 1, 1)) * span;

  const currentPath = smoothLinePath(
    points.map((point, index) => ({
      x: xForIndex(index),
      y: pad.top + plotY(point.current, max, plotH),
    })),
  );
  const previousPath = smoothLinePath(
    points.map((point, index) => ({
      x: xForIndex(index),
      y: pad.top + plotY(point.previous, max, plotH),
    })),
  );
  const xLabels = uniqueDayLabels(
    points.map((point) => point.day),
    xForIndex,
  );

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={
        points.length
          ? `${title}, ${points.map((point) => `${point.day} ${formatTick(point.current)}`).join(', ')}`
          : title
      }
    >
      <View style={styles.header}>
        <AppText
          variant="h3"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.title}
        >
          {title}
        </AppText>
        {headerRight ??
          (showMenu ? (
            <Pressable
              hitSlop={theme.dimensions.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`${title} actions`}
            >
              <DashboardIcon icon={KebabIcon} width={3} height={13} />
            </Pressable>
          ) : null)}
      </View>

      {points.length === 0 ? (
        <View style={styles.empty} accessibilityLabel="No daily sales trend data">
          <AppText variant="caption" color="textMuted">
            No trend data yet.
          </AppText>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.yTitleCol}>
            <AppText variant="overline" color="textMuted" style={styles.yTitle}>
              {yAxisLabel}
            </AppText>
          </View>

          <View style={styles.yLabelCol}>
            {ticks.map((tick) => {
              const y = pad.top + plotY(tick, max, plotH);
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

          <View
            style={styles.plot}
            onLayout={(event) => {
              const next = Math.round(event.nativeEvent.layout.width);
              if (next > 0 && next !== plotWidth) setPlotWidth(next);
            }}
          >
            <View style={[styles.canvas, trendCanvasWidth(plotWidth)]}>
              <Svg width={plotWidth} height={plotHeight}>
                {ticks.map((tick) => {
                  const y = pad.top + plotY(tick, max, plotH);
                  return (
                    <Line
                      key={`grid-${tick}`}
                      x1={pad.left}
                      y1={y}
                      x2={pad.left + plotW}
                      y2={y}
                      stroke={gridColor}
                      strokeWidth={1}
                      strokeDasharray="2 3"
                    />
                  );
                })}
                {xLabels.map((item) => (
                  <Line
                    key={`vgrid-${item.label}`}
                    x1={item.x}
                    y1={pad.top}
                    x2={item.x}
                    y2={pad.top + plotH}
                    stroke={gridColor}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />
                ))}
                <Line
                  x1={pad.left}
                  y1={pad.top}
                  x2={pad.left}
                  y2={pad.top + plotH}
                  stroke={axisColor}
                  strokeWidth={1}
                />
                <Line
                  x1={pad.left}
                  y1={pad.top + plotH}
                  x2={pad.left + plotW}
                  y2={pad.top + plotH}
                  stroke={axisColor}
                  strokeWidth={1}
                />
                {xLabels.map((item) => (
                  <Line
                    key={`tick-${item.label}`}
                    x1={item.x}
                    y1={pad.top + plotH}
                    x2={item.x}
                    y2={pad.top + plotH + 4}
                    stroke={axisColor}
                    strokeWidth={1}
                  />
                ))}
                {showPrevious ? (
                  <Path
                    d={previousPath}
                    fill="none"
                    stroke={linePreviousColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="3 3"
                  />
                ) : null}
                <Path
                  d={currentPath}
                  fill="none"
                  stroke={lineCurrentColor}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {showDots
                  ? points.map((point, index) => (
                      <Circle
                        key={`current-dot-${point.day}-${index}`}
                        cx={xForIndex(index)}
                        cy={pad.top + plotY(point.current, max, plotH)}
                        r={3.5}
                        fill={lineCurrentColor}
                      />
                    ))
                  : null}
                {showDots && showPrevious && showPreviousDots
                  ? points.map((point, index) => (
                      <Circle
                        key={`previous-dot-${point.day}-${index}`}
                        cx={xForIndex(index)}
                        cy={pad.top + plotY(point.previous, max, plotH)}
                        r={3.5}
                        fill={linePreviousColor}
                      />
                    ))
                  : null}
              </Svg>
              {xLabels.map((item) => (
                <AppText
                  key={item.label}
                  variant="overline"
                  color="textMuted"
                  style={[styles.xLabel, trendXLabelOffset(item.x)]}
                >
                  {item.label}
                </AppText>
              ))}
            </View>
          </View>
        </View>
      )}

      {showLegend || !hideXAxisTitle ? (
        <View style={styles.footer}>
          {!hideXAxisTitle && xAxisLabel ? (
            <View style={styles.xAxisTitleRow}>
              <AppText variant="overline" color="textMuted" style={styles.xAxisTitle}>
                {xAxisLabel}
              </AppText>
            </View>
          ) : null}
          {showLegend ? (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: lineCurrentColor }]} />
                <AppText
                  variant="overline"
                  style={[styles.legendLabel, { color: lineCurrentColor }]}
                >
                  {currentLabel}
                </AppText>
              </View>
              {showPrevious ? (
                <View style={styles.legendItem}>
                  <View
                    style={
                      previousLegendOutline
                        ? [styles.legendRing, { borderColor: linePreviousColor }]
                        : [styles.legendDot, { backgroundColor: linePreviousColor }]
                    }
                  />
                  <AppText
                    variant="overline"
                    style={[styles.legendLabel, { color: linePreviousColor }]}
                  >
                    {previousLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
