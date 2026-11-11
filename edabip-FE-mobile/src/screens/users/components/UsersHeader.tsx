import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

import { KpiAccuracyIcon, KpiF1Icon, KpiPrecisionIcon, KpiRecallIcon } from '@/assets/analytics';
import { ArrowUpIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { UserKpi, UserKpiId } from '@/screens/users/usersData';
import { usersHeaderStyles as styles } from '@/screens/users/components/usersHeaderStyles';

const KPI_ICONS: Record<UserKpiId, ImageSourcePropType> = {
  total: KpiAccuracyIcon,
  active: KpiPrecisionIcon,
  inactive: KpiRecallIcon,
  new: KpiF1Icon,
};

export interface UsersHeaderProps {
  topInset: number;
  firstName: string;
  avatarUrl?: string;
  initialsSource: string;
  isLoading: boolean;
  kpis: UserKpi[];
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onProfilePress: () => void;
  onRefreshPress: () => void;
}

export function UsersHeader({
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
}: UsersHeaderProps) {
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
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} isLoading={isLoading} />
        ))}
      </View>
    </EdabipAppHeader>
  );
}

function KpiCard({ kpi, isLoading }: { kpi: UserKpi; isLoading: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: '#CFC9C9' }]}>
      <View style={styles.cardTitleRow}>
        <DashboardIcon icon={KPI_ICONS[kpi.id]} size={18} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
          {kpi.title}
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
            <AppText variant="label">{kpi.value}</AppText>
            <AppText variant="caption" color="textMuted" style={styles.metricLabel}>
              {kpi.label}
            </AppText>
          </View>
          <View style={styles.metricBlock}>
            <View style={styles.changeRow}>
              <DashboardIcon icon={ArrowUpIcon} size={12} />
              <AppText variant="label" style={{ color: theme.colors.success }}>
                {kpi.change}
              </AppText>
            </View>
            <AppText variant="caption" color="textMuted" style={styles.metricLabel}>
              {kpi.changeNote}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}
