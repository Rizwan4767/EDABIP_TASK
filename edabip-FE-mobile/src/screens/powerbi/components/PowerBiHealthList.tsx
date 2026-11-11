import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ChevronDownIcon, HealthStatusIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  chartCardFill,
  powerBiSharedChartStyles as styles,
} from '@/screens/powerbi/components/powerBiSharedChartStyles';
import type { PowerBiHealthRow } from '@/screens/powerbi/powerBiData';

const HEALTH_FILTERS = ['View All', 'Healthy', 'Critical'] as const;
type HealthFilter = (typeof HEALTH_FILTERS)[number];

export function PowerBiHealthList({
  title,
  rows,
}: Readonly<{
  title: string;
  rows: PowerBiHealthRow[];
}>) {
  const theme = useTheme();
  const [filter, setFilter] = useState<HealthFilter>('View All');
  const [filterOpen, setFilterOpen] = useState(false);
  const visible = useMemo(
    () => (filter === 'View All' ? rows : rows.filter((row) => row.status === filter)),
    [filter, rows],
  );

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={title}
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Filter application health"
          style={styles.healthFilter}
        >
          <AppText variant="label" style={styles.healthFilterLabel}>
            {filter}
          </AppText>
          <DashboardIcon icon={ChevronDownIcon} width={10} height={7} />
        </Pressable>
      </View>

      <View style={styles.healthList}>
        {visible.length === 0 ? (
          <View style={styles.healthEmpty} accessibilityLabel="No applications match this filter">
            <AppText variant="caption" color="textMuted">
              No applications match this filter.
            </AppText>
          </View>
        ) : (
          visible.map((row) => {
            const critical = row.status === 'Critical';
            return (
              <View key={row.id} style={[styles.healthRow, { borderColor: theme.palette.grey200 }]}>
                <DashboardIcon icon={HealthStatusIcon} width={22} height={24} />
                <View style={styles.healthCopy}>
                  <AppText variant="bodyStrong" style={styles.healthName}>
                    {row.name}
                  </AppText>
                  <AppText variant="caption" color="textSecondary" style={styles.healthMeta}>
                    {row.meta}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.healthBadge,
                    critical ? styles.healthBadgeCritical : styles.healthBadgeHealthy,
                  ]}
                >
                  <AppText variant="caption" style={styles.healthBadgeLabel}>
                    {row.status}
                  </AppText>
                </View>
              </View>
            );
          })
        )}
      </View>

      <BottomSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Application health"
      >
        {HEALTH_FILTERS.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              setFilter(option);
              setFilterOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === option }}
            style={styles.healthFilterOption}
          >
            <AppText
              variant={filter === option ? 'bodyStrong' : 'body'}
              color={filter === option ? 'brand' : 'text'}
            >
              {option}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </View>
  );
}
