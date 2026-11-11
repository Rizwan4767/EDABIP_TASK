import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { TableauForecastPoint } from '@/screens/tableau/tableauData';
import {
  chartCardFill,
  forecastCanvasWidth,
  forecastChartLayout,
  forecastValueOffset,
  forecastXLabelOffset,
  forecastYLabelOffset,
  tableauForecastChartStyles as styles,
} from '@/screens/tableau/components/tableauForecastChartStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ChartBar, ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';

function formatTick(value: number): string {
  if (value === 0) return '0';
  return `${value / 1000}K`;
}

function formatValue(value: number): string {
  return `${Math.round(value / 1000)}k`;
}

export function TableauForecastChart({ points }: Readonly<{ points: TableauForecastPoint[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const {
    pad,
    plotHeight,
    max,
    yTicks,
    axisColor,
    gridColor,
    thisMonthColor,
    lastMonthColor,
    barWidth,
    pairGap,
  } = forecastChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(points.length, 1);
  const baseline = pad.top + plotH;
  const barRadius = barWidth / 2;

  const groups = points.map((point, index) => {
    const pairWidth = barWidth * 2 + pairGap;
    const startX = pad.left + index * slot + (slot - pairWidth) / 2;
    const thisY = pad.top + (1 - point.thisMonth / max) * plotH;
    const lastY = pad.top + (1 - point.lastMonth / max) * plotH;
    return {
      ...point,
      thisX: startX,
      lastX: startX + barWidth + pairGap,
      thisY,
      lastY,
      thisHeight: Math.max(0, baseline - thisY),
      lastHeight: Math.max(0, baseline - lastY),
      centerX: startX + pairWidth / 2,
    };
  });

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.heading}>
        <View style={styles.header}>
          <AppText variant="h3" numberOfLines={1} style={styles.title}>
            Revenue Forecast (Next 3 Months)
          </AppText>
          <Pressable
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Revenue forecast actions"
          >
            <DashboardIcon icon={KebabIcon} width={3} height={13} />
          </Pressable>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { borderColor: thisMonthColor }]} />
            <AppText variant="caption" style={styles.legendLabel}>
              This month
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { borderColor: lastMonthColor }]} />
            <AppText variant="caption" style={styles.legendLabel}>
              Last month
            </AppText>
          </View>
        </View>
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
                style={[styles.yLabel, forecastYLabelOffset(y)]}
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
          <View style={[styles.canvas, forecastCanvasWidth(plotWidth)]}>
            <ChartPlotFrame
              width={plotWidth}
              height={plotHeight}
              padTop={pad.top}
              padLeft={pad.left}
              plotW={plotW}
              plotH={plotH}
              yTicks={yTicks}
              max={max}
              xPositions={groups.map((group) => group.centerX)}
              axisColor={axisColor}
              gridColor={gridColor}
            />
            {groups.map((group) => (
              <ChartBar
                key={`${group.month}-this`}
                x={group.thisX}
                y={group.thisY}
                width={barWidth}
                height={group.thisHeight}
                color={thisMonthColor}
                radius={barRadius}
              />
            ))}
            {groups.map((group) => (
              <ChartBar
                key={`${group.month}-last`}
                x={group.lastX}
                y={group.lastY}
                width={barWidth}
                height={group.lastHeight}
                color={lastMonthColor}
                radius={barRadius}
              />
            ))}
            {groups.map((group) => (
              <AppText
                key={`${group.month}-this-value`}
                variant="overline"
                style={[styles.value, forecastValueOffset(group.thisX + barWidth / 2, group.thisY)]}
              >
                {formatValue(group.thisMonth)}
              </AppText>
            ))}
            {groups.map((group) => (
              <AppText
                key={`${group.month}-last-value`}
                variant="overline"
                style={[styles.value, forecastValueOffset(group.lastX + barWidth / 2, group.lastY)]}
              >
                {formatValue(group.lastMonth)}
              </AppText>
            ))}
            {groups.map((group) => (
              <AppText
                key={`${group.month}-x`}
                variant="overline"
                color="textMuted"
                style={[styles.xLabel, forecastXLabelOffset(group.centerX)]}
              >
                {group.month}
              </AppText>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
