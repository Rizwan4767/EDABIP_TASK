import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ChartBar, ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';
import {
  chartCardFill,
  customerDemandChartStyles as styles,
  customerDemandLayout,
  demandCanvasWidth,
  demandValueOffset,
  demandXLabelOffset,
  demandYLabelOffset,
} from '@/screens/powerbi/components/customerDemandChartStyles';
import type { PowerBiCategoryBar } from '@/screens/powerbi/powerBiData';
import { salesUsdTick } from '@/screens/powerbi/salesAnalyticsChart';

function demandTick(value: number): string {
  if (value <= 0) {
    return '$0';
  }
  return salesUsdTick(value);
}

export function CustomerDemandChart({ bars }: Readonly<{ bars: PowerBiCategoryBar[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const { pad, plotHeight, max, yTicks, axisColor, gridColor, barRatio, minBarWidth } =
    customerDemandLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(bars.length, 1);
  const barWidth = Math.max(minBarWidth, slot * barRatio);
  const baseline = pad.top + plotH;

  const plotted = bars.map((bar, index) => {
    const x = pad.left + index * slot + (slot - barWidth) / 2;
    const y = pad.top + (1 - bar.value / max) * plotH;
    return { ...bar, x, y, height: Math.max(0, baseline - y), centerX: x + barWidth / 2 };
  });

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={
        bars.length
          ? `Demand prediction next 7 days, ${bars
              .map((bar) => `${bar.label} ${bar.displayValue}`)
              .join(', ')}`
          : 'Demand prediction next 7 days'
      }
    >
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

      {bars.length === 0 ? (
        <View accessibilityLabel="No demand prediction data">
          <AppText variant="caption" color="textMuted">
            No demand data yet.
          </AppText>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.yTitleCol}>
            <AppText variant="overline" color="textMuted" style={styles.yTitle}>
              Revenue (USD)
            </AppText>
          </View>

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
                  {demandTick(tick)}
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
                xPositions={plotted.map((bar) => bar.centerX)}
                axisColor={axisColor}
                gridColor={gridColor}
              />
              {plotted.map((bar) => (
                <ChartBar
                  key={bar.id}
                  x={bar.x}
                  y={bar.y}
                  width={barWidth}
                  height={bar.height}
                  color={bar.color}
                  radius={3}
                />
              ))}
              {plotted.map((bar) => (
                <AppText
                  key={`${bar.id}-value`}
                  variant="overline"
                  style={[styles.value, demandValueOffset(bar.centerX, bar.y)]}
                >
                  {bar.displayValue}
                </AppText>
              ))}
              {plotted.map((bar) => (
                <AppText
                  key={`${bar.id}-x`}
                  variant="overline"
                  color="textMuted"
                  style={[styles.xLabel, demandXLabelOffset(bar.centerX)]}
                >
                  {bar.label}
                </AppText>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
