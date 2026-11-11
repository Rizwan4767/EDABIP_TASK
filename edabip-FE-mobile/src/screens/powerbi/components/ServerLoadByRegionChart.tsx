import { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { ChartBar, ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';
import {
  chartCardFill,
  serverLoadByRegionChartStyles as styles,
  serverLoadCanvasWidth,
  serverLoadLayout,
  serverLoadValueOffset,
  serverLoadXLabelOffset,
  serverLoadYLabelOffset,
} from '@/screens/powerbi/components/serverLoadByRegionChartStyles';
import type { PowerBiCategoryBar } from '@/screens/powerbi/powerBiData';
import { salesUsdTick } from '@/screens/powerbi/salesAnalyticsChart';

function loadTick(value: number): string {
  if (value <= 0) {
    return '0';
  }
  return salesUsdTick(value);
}

export function ServerLoadByRegionChart({ bars }: Readonly<{ bars: PowerBiCategoryBar[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const { pad, plotHeight, max, yTicks, axisColor, gridColor, barRatio, minBarWidth } =
    serverLoadLayout;
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
          ? `Server load by region, ${bars
              .map((bar) => `${bar.label} ${bar.displayValue}`)
              .join(', ')}`
          : 'Server load by region'
      }
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Server Load By Region
        </AppText>
      </View>

      {bars.length === 0 ? (
        <View accessibilityLabel="No server load data">
          <AppText variant="caption" color="textMuted">
            No server load data yet.
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
                  style={[styles.yLabel, serverLoadYLabelOffset(y)]}
                >
                  {loadTick(tick)}
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
            <View style={[styles.canvas, serverLoadCanvasWidth(plotWidth)]}>
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
                  radius={4}
                />
              ))}
              {plotted.map((bar) => (
                <AppText
                  key={`${bar.id}-value`}
                  variant="overline"
                  style={[styles.value, serverLoadValueOffset(bar.centerX, bar.y)]}
                >
                  {bar.displayValue}
                </AppText>
              ))}
              {plotted.map((bar) => (
                <AppText
                  key={`${bar.id}-x`}
                  variant="overline"
                  color="textMuted"
                  numberOfLines={1}
                  style={[styles.xLabel, serverLoadXLabelOffset(bar.centerX, slot)]}
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
