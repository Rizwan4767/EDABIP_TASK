import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/analytics';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { DemandPoint } from '@/screens/analytics/analyticsData';
import {
  chartCardFill,
  demandCanvasWidth,
  demandChartLayout,
  demandPredictionChartStyles as styles,
  demandValueOffset,
  demandXLabelOffset,
  demandYLabelOffset,
} from '@/screens/analytics/components/demandPredictionChartStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ChartBar, ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';

function formatTick(value: number): string {
  if (value === 0) return '$0';
  return `$${value / 1000}K`;
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US');
}

export function DemandPredictionChart({ points }: Readonly<{ points: DemandPoint[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const { pad, plotHeight, max, yTicks, axisColor, gridColor, barRatio, minBarWidth } =
    demandChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(points.length, 1);
  const barWidth = Math.max(minBarWidth, slot * barRatio);
  const baseline = pad.top + plotH;

  const bars = points.map((point, index) => {
    const x = pad.left + index * slot + (slot - barWidth) / 2;
    const y = pad.top + (1 - point.value / max) * plotH;
    return { ...point, x, y, height: Math.max(0, baseline - y), centerX: x + barWidth / 2 };
  });

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Demand Prediction (Next 7 Days)
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Demand prediction actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.yLabelCol}>
          {yTicks.map((tick) => {
            const y = pad.top + (1 - tick / max) * plotH;
            return (
              <AppText
                key={tick}
                variant="overline"
                color="textMuted"
                style={[styles.yLabel, demandYLabelOffset(y)]}
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
          <View style={[styles.canvas, demandCanvasWidth(plotWidth)]}>
            <ChartPlotFrame
              width={plotWidth}
              height={plotHeight}
              padTop={pad.top}
              padLeft={pad.left}
              plotW={plotW}
              plotH={plotH}
              yTicks={yTicks}
              max={max}
              xPositions={bars.map((bar) => bar.centerX)}
              axisColor={axisColor}
              gridColor={gridColor}
            />
            {bars.map((bar) => (
              <ChartBar
                key={bar.day}
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={bar.height}
                color={bar.color}
                radius={3}
              />
            ))}
            {bars.map((bar) => (
              <AppText
                key={`${bar.day}-value`}
                variant="overline"
                style={[styles.value, demandValueOffset(bar.centerX, bar.y)]}
              >
                {formatValue(bar.value)}
              </AppText>
            ))}
            {bars.map((bar) => (
              <AppText
                key={`${bar.day}-x`}
                variant="overline"
                color="textMuted"
                style={[styles.xLabel, demandXLabelOffset(bar.centerX)]}
              >
                {bar.day}
              </AppText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
