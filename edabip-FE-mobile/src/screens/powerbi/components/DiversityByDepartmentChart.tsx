import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';
import {
  chartCardFill,
  diversityByDepartmentChartStyles as styles,
  diversityCanvasWidth,
  diversityCapHeight,
  diversityChartLayout,
  diversityStackPos,
  diversityValueOffset,
  diversityXLabelOffset,
  diversityYLabelOffset,
} from '@/screens/powerbi/components/diversityByDepartmentChartStyles';
import type { PowerBiCategoryBar } from '@/screens/powerbi/powerBiData';

function thousandsTick(value: number): string {
  if (value <= 0) return '0';
  return `${value / 1000}K`;
}

export function DiversityByDepartmentChart({ bars }: Readonly<{ bars: PowerBiCategoryBar[] }>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(220);
  const { pad, plotHeight, max, yTicks, axisColor, gridColor, barRatio, minBarWidth, barRadius } =
    diversityChartLayout;
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(bars.length, 1);
  const barWidth = Math.max(minBarWidth, slot * barRatio);
  const baseline = pad.top + plotH;

  const plotted = bars.map((bar, index) => {
    const total = Math.max(bar.total ?? bar.value, bar.value);
    const x = pad.left + index * slot + (slot - barWidth) / 2;
    const y = pad.top + (1 - total / max) * plotH;
    const valueHeight = (bar.value / max) * plotH;
    const totalHeight = Math.max(0, baseline - y);
    return {
      ...bar,
      x,
      y,
      totalHeight,
      capHeight: Math.max(0, totalHeight - valueHeight),
      centerX: x + barWidth / 2,
    };
  });

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={
        bars.length
          ? `Diversity by department, ${bars
              .map((bar) => `${bar.label} ${bar.displayValue}`)
              .join(', ')}`
          : 'Diversity by department'
      }
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          Diversity By Department
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Diversity by department actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      {bars.length === 0 ? (
        <View accessibilityLabel="No diversity data">
          <AppText variant="caption" color="textMuted">
            No diversity data yet.
          </AppText>
        </View>
      ) : (
        <View style={styles.row}>
          <View style={styles.yLabelCol}>
            {yTicks.map((tick) => {
              const y = pad.top + (1 - tick / max) * plotH;
              return (
                <AppText
                  key={tick}
                  variant="overline"
                  color="textMuted"
                  style={[styles.yLabel, diversityYLabelOffset(y)]}
                >
                  {thousandsTick(tick)}
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
            <View style={[styles.canvas, diversityCanvasWidth(plotWidth)]}>
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
                <View
                  key={bar.id}
                  style={[
                    styles.stack,
                    diversityStackPos(bar.x, bar.y, barWidth, bar.totalHeight, barRadius),
                  ]}
                >
                  <View
                    style={[
                      styles.cap,
                      diversityCapHeight(bar.capHeight),
                      { backgroundColor: bar.capColor ?? bar.color },
                    ]}
                  />
                  <View style={[styles.fill, { backgroundColor: bar.color }]} />
                </View>
              ))}
              {plotted.map((bar) => (
                <AppText
                  key={`${bar.id}-value`}
                  variant="overline"
                  style={[styles.value, diversityValueOffset(bar.centerX, bar.y)]}
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
                  style={[styles.xLabel, diversityXLabelOffset(bar.centerX, slot)]}
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
