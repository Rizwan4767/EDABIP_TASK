import React from 'react';
import { Image, View } from 'react-native';

import { StatGrowthIcon, StatPeakIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { activeUsersChartStyles as styles } from '@/screens/dashboard/components/activeUsersChartStyles';
import { DaySprayBar } from '@/screens/dashboard/components/DaySprayBar';
import type { ActiveUserPoint, UserStat } from '@/screens/dashboard/dashboardData';

const MAX_USERS = 100_000;
const Y_TICKS = [100_000, 75_000, 50_000, 25_000, 0];

const DAY_MAP: Record<string, 'Sun' | 'Mon' | 'Tus' | 'Wed' | 'Thu' | 'Fri' | 'Sat'> = {
  Sun: 'Sun',
  Mon: 'Mon',
  Tue: 'Tus',
  Tues: 'Tus',
  Tus: 'Tus',
  Wed: 'Wed',
  Wedn: 'Wed',
  Thu: 'Thu',
  Thur: 'Thu',
  Fri: 'Fri',
  Sat: 'Sat',
};

function formatTick(value: number): string {
  if (value === 0) return '0';
  return `$${value / 1000}K`;
}

function formatValue(value: number): string {
  return value.toLocaleString('en-US');
}

export function ActiveUsersChart({
  points,
  stats,
}: Readonly<{
  points: ActiveUserPoint[];
  stats: UserStat[];
}>) {
  const theme = useTheme();

  // Layout measurements matching Figma proportions
  const PLOT_H = 195;
  const PAD_TOP = 28; // room for top value label above highest tip
  const PAD_BOT = 26; // room for day labels below baseline
  const BAR_AREA = PLOT_H - PAD_TOP - PAD_BOT;
  const BASELINE_Y = PAD_TOP + BAR_AREA;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <AppText style={styles.title}>Active Users</AppText>

      {/* ── Chart Row: Left Axis Title + Ticks + Plot Area ───────────── */}
      <View style={styles.chartRow}>
        {/* Rotated "Active User Count" label */}
        <View style={[styles.yTitleWrapper, { height: PLOT_H }]}>
          <AppText style={styles.yTitleText}>Active User Count</AppText>
        </View>

        {/* Y-axis Ticks & Vertical Axis line */}
        <View style={[styles.yAxisCol, { height: PLOT_H }]}>
          {Y_TICKS.map((tick) => {
            const topPct = 1 - tick / MAX_USERS;
            const top = PAD_TOP + topPct * BAR_AREA;
            return (
              <View key={tick} style={[styles.tickRow, { top: top - 8 }]}>
                <AppText style={styles.tickText}>{formatTick(tick)}</AppText>
                <View style={styles.tickMark} />
              </View>
            );
          })}
          {/* Vertical axis line */}
          <View style={[styles.verticalAxisLine, { top: PAD_TOP, height: BAR_AREA }]} />
        </View>

        {/* Plot Area */}
        <View style={[styles.plot, { height: PLOT_H }]}>
          {/* Horizontal Grid lines */}
          {Y_TICKS.map((tick) => {
            const topPct = 1 - tick / MAX_USERS;
            const top = PAD_TOP + topPct * BAR_AREA;
            if (tick === 0) {
              return <View key={tick} style={[styles.baseline, { top }]} />;
            }
            return <View key={tick} style={[styles.gridLine, { top }]} />;
          })}

          {/* 7 Columns */}
          <View style={styles.columnsRow}>
            {points.map((point) => {
              const dayKey = DAY_MAP[point.day] ?? 'Thu';
              const barPct = Math.max(0, Math.min(1, point.value / MAX_USERS));
              const barH = Math.max(16, barPct * BAR_AREA);
              const barTop = BASELINE_Y - barH;

              return (
                <View key={point.day} style={styles.col}>
                  {/* Value label sitting cleanly above the orange dot with 4-6px gap */}
                  <AppText style={[styles.valueLabel, { top: barTop - 20 }]}>
                    {formatValue(point.value)}
                  </AppText>

                  {/* Amber tip circle centered at barTop */}
                  <View style={[styles.tipCircle, { top: barTop - 8 }]} />

                  {/* Organic spray stem from barTop down to baseline */}
                  <View style={[styles.stemWrapper, { top: barTop, height: barH }]}>
                    <DaySprayBar day={dayKey} width={18} height="100%" />
                  </View>

                  {/* Open base circle centered on the baseline */}
                  <View style={[styles.baseCircle, { top: BASELINE_Y - 4 }]} />

                  {/* Day label below baseline */}
                  <View style={[styles.dayLabelWrap, { top: BASELINE_Y + 6 }]}>
                    <AppText style={styles.dayLabel}>{dayKey}</AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* "Days" label centered under the day names */}
      <AppText style={styles.xTitle}>Days</AppText>

      {/* ── Bottom Stats Footer ────────────────────────────────────────── */}
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.id}>
            {index > 0 && <View style={styles.statDivider} />}
            <View style={styles.statItem}>
              <Image
                source={stat.id === 'growth' ? StatGrowthIcon : StatPeakIcon}
                style={{ width: 14, height: 14 }}
                resizeMode="contain"
              />
              <View style={styles.statTextCol}>
                <AppText style={styles.statLabel} numberOfLines={1}>
                  {stat.label}
                </AppText>
                <AppText
                  style={[
                    styles.statValue,
                    stat.tone === 'green' ? styles.statValueGreen : undefined,
                  ]}
                >
                  {stat.value}
                </AppText>
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
