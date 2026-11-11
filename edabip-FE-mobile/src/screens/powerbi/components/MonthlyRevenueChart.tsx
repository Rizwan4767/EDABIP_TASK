import { useId, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Pattern,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { KebabIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  chartCardFill,
  monthlyCanvasWidth,
  monthlyChartLayout,
  monthlyRevenueChartStyles as styles,
  monthlyXLabelOffset,
  monthlyYLabelOffset,
} from '@/screens/powerbi/components/monthlyRevenueChartStyles';
import type { MonthlyRevenueBar } from '@/screens/powerbi/powerBiData';
import {
  monthlyRevenueScale,
  plotY,
  salesBarLabel,
  salesUsdTick,
} from '@/screens/powerbi/salesAnalyticsChart';
import { fontFamily } from '@/theme';

export function MonthlyRevenueChart({ bars }: Readonly<{ bars: MonthlyRevenueBar[] }>) {
  const theme = useTheme();
  const svgId = useId().replace(/:/g, '');
  const [plotWidth, setPlotWidth] = useState(240);
  const { pad, plotHeight, axisColor, gridColor, stripe, stripeBg } = monthlyChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(bars.length, 1);
  const barWidth = Math.min(monthlyChartLayout.barWidth, Math.max(12, slot * 0.42));
  const centers = bars.map((_, index) => pad.left + slot * index + slot / 2);
  const maxValue = Math.max(0, ...bars.map((bar) => Math.max(bar.total, bar.value)));
  const { max, ticks } = monthlyRevenueScale(maxValue);
  const gradientId = `sa-bar-gradient-${svgId}`;
  const stripeId = `sa-bar-stripes-${svgId}`;

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={
        bars.length
          ? `Monthly revenue trends, ${bars
              .map((bar) => `${bar.month} ${salesBarLabel(bar.total)}`)
              .join(', ')}`
          : 'Monthly revenue trends'
      }
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Monthly Revenue Trends
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Monthly revenue trends actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      {bars.length === 0 ? (
        <View style={styles.empty} accessibilityLabel="No monthly revenue data">
          <AppText variant="caption" color="textMuted">
            No monthly revenue yet.
          </AppText>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.yLabelCol}>
            {ticks.map((tick) => {
              const y = pad.top + plotY(tick, max, plotH);
              return (
                <AppText
                  key={tick}
                  variant="overline"
                  color="textMuted"
                  style={[styles.yLabel, monthlyYLabelOffset(y)]}
                >
                  {salesUsdTick(tick)}
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
            <View style={[styles.canvas, monthlyCanvasWidth(plotWidth)]}>
              <Svg width={plotWidth} height={plotHeight}>
                <Defs>
                  <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor="#A98BF0" stopOpacity={0.35} />
                    <Stop offset="50%" stopColor="#A98BF0" stopOpacity={1} />
                    <Stop offset="100%" stopColor="#6D4FD1" stopOpacity={1} />
                  </LinearGradient>
                  <Pattern id={stripeId} patternUnits="userSpaceOnUse" width={4} height={4}>
                    <Rect width={4} height={4} fill={stripeBg} />
                    <Line x1={0} y1={0} x2={0} y2={4} stroke={stripe} strokeWidth={1.4} />
                  </Pattern>
                  {bars.map((bar, index) => {
                    const total = Math.max(0, bar.total);
                    const totalHeight = Math.max(1, (total / Math.max(max, 1)) * plotH);
                    const x = (centers[index] ?? 0) - barWidth / 2;
                    const y = pad.top + plotH - totalHeight;
                    return (
                      <ClipPath
                        key={`clip-${bar.month}-${index}`}
                        id={`sa-bar-clip-${svgId}-${index}`}
                      >
                        <Rect x={x} y={y} width={barWidth} height={totalHeight} rx={5} ry={5} />
                      </ClipPath>
                    );
                  })}
                </Defs>

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
                {ticks
                  .filter((tick) => tick !== 0)
                  .map((tick) => {
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
                        strokeDasharray="3 3"
                      />
                    );
                  })}

                {bars.map((bar, index) => {
                  const total = Math.max(0, bar.total);
                  const value = Math.min(Math.max(0, bar.value), total);
                  const totalHeight = Math.max(1, (total / Math.max(max, 1)) * plotH);
                  const valueHeight = (value / Math.max(max, 1)) * plotH;
                  const x = (centers[index] ?? 0) - barWidth / 2;
                  const y = pad.top + plotH - totalHeight;
                  const clipId = `sa-bar-clip-${svgId}-${index}`;
                  return (
                    <G key={`${bar.month}-${index}`} clipPath={`url(#${clipId})`}>
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={totalHeight}
                        fill={`url(#${stripeId})`}
                      />
                      {valueHeight > 0 ? (
                        <Rect
                          x={x}
                          y={pad.top + plotH - valueHeight}
                          width={barWidth}
                          height={valueHeight}
                          fill={`url(#${gradientId})`}
                        />
                      ) : null}
                    </G>
                  );
                })}
                {bars.map((bar, index) => {
                  const totalHeight = (Math.max(0, bar.total) / Math.max(max, 1)) * plotH;
                  const y = pad.top + plotH - totalHeight;
                  return (
                    <SvgText
                      key={`${bar.month}-value-${index}`}
                      x={centers[index] ?? 0}
                      y={Math.max(11, y - 5)}
                      fill="#1C2430"
                      fontFamily={fontFamily.semibold}
                      fontSize={9}
                      fontWeight="600"
                      textAnchor="middle"
                      alignmentBaseline="baseline"
                    >
                      {salesBarLabel(bar.total)}
                    </SvgText>
                  );
                })}
              </Svg>
              {bars.map((bar, index) => (
                <AppText
                  key={`${bar.month}-x-${index}`}
                  variant="overline"
                  color="textMuted"
                  style={[styles.xLabel, monthlyXLabelOffset(centers[index] ?? 0)]}
                >
                  {bar.month}
                </AppText>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
