import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

import { ArrowUpIcon, CustomersIcon, ReportsIcon, RevenueIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { dashboardHeaderStyles as styles } from '@/screens/dashboard/components/dashboardHeaderStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { DashboardKpis } from '@/screens/dashboard/dashboardData';

export interface DashboardHeaderProps {
  topInset: number;
  firstName: string;
  avatarUrl?: string;
  initialsSource: string;
  isLoading: boolean;
  kpis: DashboardKpis;
  onMenuPress: () => void;
  onSearchPress: () => void;
  onProfilePress: () => void;
  onRefreshPress: () => void;
}

export function DashboardHeader({
  topInset,
  firstName,
  avatarUrl,
  initialsSource,
  isLoading,
  kpis,
  onMenuPress,
  onSearchPress,
  onProfilePress,
  onRefreshPress,
}: Readonly<DashboardHeaderProps>) {
  return (
    <EdabipAppHeader
      topInset={topInset}
      firstName={firstName}
      avatarUrl={avatarUrl}
      initialsSource={initialsSource}
      onMenuPress={onMenuPress}
      onSearchPress={onSearchPress}
      onProfilePress={onProfilePress}
      onRefreshPress={onRefreshPress}
    >
      <View style={styles.kpiGrid}>
        <KpiCard
          icon={RevenueIcon}
          title="Revenue"
          value={kpis.revenue.value}
          label={kpis.revenue.label}
          change={kpis.revenue.change}
          changeNote={kpis.revenue.changeNote}
          isLoading={isLoading}
        />
        <KpiCard
          icon={CustomersIcon}
          title="Customers"
          value={kpis.customers.value}
          label={kpis.customers.label}
          change={kpis.customers.change}
          changeNote={kpis.customers.changeNote}
          isLoading={isLoading}
        />
        <KpiCard
          icon={ReportsIcon}
          title="Reports"
          value={kpis.reports.value}
          label={kpis.reports.label}
          badge={kpis.reports.badge}
          badgeTone="warning"
          isLoading={isLoading}
        />
        <KpiCard
          icon={ReportsIcon}
          title="System Health"
          value={kpis.systemHealth.value}
          label={kpis.systemHealth.label}
          badge={kpis.systemHealth.badge}
          badgeTone="success"
          isLoading={isLoading}
        />
      </View>
    </EdabipAppHeader>
  );
}

interface KpiCardProps {
  icon: ImageSourcePropType;
  title: string;
  value: string;
  label: string;
  change?: string;
  changeNote?: string;
  badge?: string;
  badgeTone?: 'warning' | 'success';
  isLoading: boolean;
}

function KpiCard({
  icon,
  title,
  value,
  label,
  change,
  changeNote,
  badge,
  badgeTone,
  isLoading,
}: Readonly<KpiCardProps>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#CFC9C9' }]}>
      <View style={styles.cardTitleRow}>
        <DashboardIcon icon={icon} size={20} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
          {title}
        </AppText>
      </View>
      {isLoading ? (
        <View style={styles.skeleton}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="70%" height={10} />
        </View>
      ) : (
        <View style={styles.metrics}>
          <View style={styles.metricBlock}>
            <AppText variant="label">{value}</AppText>
            <AppText variant="caption" color="textMuted" style={styles.metricLabel}>
              {label}
            </AppText>
          </View>
          {change ? (
            <View style={styles.metricBlock}>
              <View style={styles.changeRow}>
                <DashboardIcon icon={ArrowUpIcon} size={14} />
                <AppText variant="label" style={{ color: theme.colors.success }}>
                  {change}
                </AppText>
              </View>
              <AppText variant="caption" color="textMuted" style={styles.metricLabel}>
                {changeNote}
              </AppText>
            </View>
          ) : null}
          {badge ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    badgeTone === 'warning' ? theme.palette.amber100 : theme.palette.green100,
                },
              ]}
            >
              <AppText variant="overline" style={styles.badgeLabel}>
                {badge}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
