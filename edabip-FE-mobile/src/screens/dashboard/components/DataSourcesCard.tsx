import { Pressable, View } from 'react-native';

import {
  ClockIcon,
  SourceHealthyIcon,
  SourceInactiveIcon,
  SourceTotalIcon,
  SourceWarningIcon,
} from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { DataSource, SourceStat } from '@/screens/dashboard/dashboardData';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { dataSourcesCardStyles as styles } from '@/screens/dashboard/components/dataSourcesCardStyles';
import { HealthRing } from '@/screens/dashboard/components/HealthRing';
import { StatusPill } from '@/screens/dashboard/components/StatusPill';

const SOURCE_ICONS = {
  total: SourceTotalIcon,
  healthy: SourceHealthyIcon,
  warning: SourceWarningIcon,
  inactive: SourceInactiveIcon,
} as const;

export function DataSourcesCard({
  stats,
  sources,
  onViewAll,
}: Readonly<{
  stats: SourceStat[];
  sources: DataSource[];
  onViewAll: () => void;
}>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="h3">Active Data Source</AppText>
          <View style={[styles.refreshBadge, { backgroundColor: theme.palette.amber100 }]}>
            <AppText variant="overline" style={styles.refreshLabel}>
              Auto Refresh: Every 60 Seconds
            </AppText>
          </View>
        </View>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all sources"
        >
          <AppText variant="caption" color="textSecondary">
            View all
          </AppText>
        </Pressable>
      </View>

      <View style={styles.stats}>
        {stats.map((stat) => (
          <View
            key={stat.id}
            style={[styles.stat, { backgroundColor: theme.colors.surface, borderColor: '#CFC9C9' }]}
          >
            <DashboardIcon icon={SOURCE_ICONS[stat.id]} size={11} />
            <View style={styles.statTextWrap}>
              <AppText
                variant="overline"
                color="textSecondary"
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {stat.label}
              </AppText>
              <AppText
                variant="label"
                style={{ color: theme.colors.success, fontSize: 10 }}
                numberOfLines={1}
              >
                {stat.value}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {sources.map((source) => {
          const isInactive = source.status === 'Inactive';
          return (
            <View
              key={source.source}
              style={[
                styles.source,
                { borderColor: '#CFC9C9', backgroundColor: theme.colors.surface },
              ]}
            >
              <View style={styles.sourceTop}>
                <AppText variant="caption" color="textSecondary">
                  {source.source}
                </AppText>
                <StatusPill status={source.status} />
              </View>
              <View style={styles.sourceBody}>
                <HealthRing percent={source.health} tone={isInactive ? 'danger' : 'success'} />
                <View style={styles.sourceCopy}>
                  <AppText variant="caption" color="textSecondary">
                    System Health
                  </AppText>
                  <AppText
                    variant="overline"
                    style={[
                      styles.healthLabel,
                      { color: isInactive ? theme.colors.danger : theme.colors.textSecondary },
                    ]}
                  >
                    {source.healthLabel}
                  </AppText>
                </View>
                <View style={styles.refresh}>
                  <DashboardIcon icon={ClockIcon} size={16} />
                  <AppText variant="overline" style={styles.refreshMeta} numberOfLines={1}>
                    {source.refreshed}
                  </AppText>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
