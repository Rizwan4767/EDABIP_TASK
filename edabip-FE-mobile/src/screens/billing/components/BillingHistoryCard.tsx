import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { BillingHistory } from '@/screens/billing/billingData';
import {
  billingHistoryCardStyles as styles,
  billingHistoryLayout,
  chartCardFill,
  historyCanvasWidth,
  historyXLabelOffset,
  historyYLabelOffset,
} from '@/screens/billing/components/billingHistoryCardStyles';
import { ChartBar, ChartPlotFrame } from '@/screens/dashboard/components/ViewChart';

export function BillingHistoryCard({
  history,
  onViewAll,
}: Readonly<{
  history: BillingHistory;
  onViewAll?: () => void;
}>) {
  const theme = useTheme();
  const [plotWidth, setPlotWidth] = useState(160);
  const { pad, plotHeight, axisColor, gridColor, barWidth } = billingHistoryLayout;
  const max = history.axisMax && history.axisMax > 0 ? history.axisMax : billingHistoryLayout.max;
  const yTickLabels =
    history.yTickLabels?.length === 5
      ? history.yTickLabels
      : billingHistoryLayout.yTicks.map((tick) =>
          tick === 0 ? '0' : `₹${Math.round(tick / 1000)}K`,
        );
  const yTicks = [1, 0.75, 0.5, 0.25, 0].map((fraction) => fraction * max);
  const plotW = Math.max(1, plotWidth - pad.left - pad.right);
  const plotH = plotHeight - pad.top - pad.bottom;
  const slot = plotW / Math.max(history.bars.length, 1);

  const bars = history.bars.map((bar, index) => {
    const height = max > 0 ? (bar.value / max) * plotH : 0;
    const x = pad.left + index * slot + (slot - barWidth) / 2;
    const y = pad.top + plotH - height;
    return { ...bar, x, y, height, centerX: x + barWidth / 2 };
  });

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, '#CFC9C9')]}
      accessibilityLabel="Billing history"
    >
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Billing History
        </AppText>
        {onViewAll ? (
          <Pressable
            onPress={onViewAll}
            hitSlop={theme.dimensions.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="View all billing history"
          >
            <AppText variant="caption" style={styles.viewAll}>
              View all
            </AppText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <AppText variant="caption" style={styles.statLabel}>
              Total Paid
            </AppText>
            <AppText variant="bodyStrong" style={styles.statValue}>
              {history.totalPaid}
            </AppText>
          </View>
          <View style={styles.stat}>
            <AppText variant="caption" style={styles.statLabel}>
              Total Invoices
            </AppText>
            <AppText variant="bodyStrong" style={styles.statValue}>
              {history.totalInvoices}
            </AppText>
          </View>
          <View style={styles.stat}>
            <AppText variant="caption" style={styles.statLabel}>
              Outstanding Amount
            </AppText>
            <AppText variant="bodyStrong" style={styles.statValue}>
              {history.outstanding}
            </AppText>
          </View>
        </View>

        <View style={styles.chart}>
          <View style={styles.plotRow}>
            <View style={styles.yLabelCol}>
              {yTicks.map((tick, index) => {
                const y = pad.top + (1 - (max > 0 ? tick / max : 0)) * plotH;
                return (
                  <AppText
                    key={`${tick}-${index}`}
                    variant="overline"
                    color="textMuted"
                    style={[styles.yLabel, historyYLabelOffset(y)]}
                  >
                    {yTickLabels[index] ?? ''}
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
              <View style={[styles.canvas, historyCanvasWidth(plotWidth)]}>
                <ChartPlotFrame
                  width={plotWidth}
                  height={plotHeight}
                  padTop={pad.top}
                  padLeft={pad.left}
                  plotW={plotW}
                  plotH={plotH}
                  yTicks={yTicks}
                  max={max || 1}
                  xPositions={bars.map((bar) => bar.centerX)}
                  axisColor={axisColor}
                  gridColor={gridColor}
                />
                {bars.map((bar) => (
                  <ChartBar
                    key={bar.month}
                    x={bar.x}
                    y={bar.y}
                    width={barWidth}
                    height={bar.height}
                    color={bar.color}
                    radius={4}
                  />
                ))}
                {bars.map((bar) => (
                  <AppText
                    key={`${bar.month}-label`}
                    variant="overline"
                    color="textMuted"
                    style={[styles.xLabel, historyXLabelOffset(bar.centerX)]}
                  >
                    {bar.month}
                  </AppText>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
