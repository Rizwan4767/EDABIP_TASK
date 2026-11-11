import type { ImageSourcePropType } from 'react-native';
import { View } from 'react-native';

import {
  ArrowUpIcon,
  KpiAccuracyIcon,
  KpiF1Icon,
  KpiPrecisionIcon,
  KpiRecallIcon,
} from '@/assets/analytics';
import { AppText } from '@/components/common/AppText';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import type { AnalyticsKpi, AnalyticsKpiId } from '@/screens/analytics/analyticsData';
import {
  analyticsHeaderStyles as styles,
  kpiCardFill,
  kpiTrendFill,
} from '@/screens/analytics/components/analyticsHeaderStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const KPI_ICONS: Record<AnalyticsKpiId, ImageSourcePropType> = {
  accuracy: KpiAccuracyIcon,
  precision: KpiPrecisionIcon,
  recall: KpiRecallIcon,
  f1: KpiF1Icon,
};

export interface AnalyticsHeaderProps {
  topInset: number;
  firstName: string;
  avatarUrl?: string;
  initialsSource: string;
  isLoading: boolean;
  kpis: AnalyticsKpi[];
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onProfilePress: () => void;
  onRefreshPress: () => void;
}

export function AnalyticsHeader({
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
}: Readonly<AnalyticsHeaderProps>) {
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

function KpiCard({ kpi, isLoading }: Readonly<{ kpi: AnalyticsKpi; isLoading: boolean }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, kpiCardFill(theme.colors.surface)]}>
      <View style={styles.cardTitleRow}>
        <DashboardIcon icon={KPI_ICONS[kpi.id]} size={18} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
          {kpi.title}
        </AppText>
      </View>
      {isLoading ? (
        <View style={styles.skeleton}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={12} />
        </View>
      ) : (
        <View style={styles.metrics}>
          <AppText variant="label" style={styles.value}>
            {kpi.value}
          </AppText>
          <View style={[styles.trend, kpiTrendFill[kpi.trend.tone]]}>
            <View style={kpi.trend.direction === 'down' ? styles.trendDown : undefined}>
              <DashboardIcon icon={ArrowUpIcon} size={8} />
            </View>
            <AppText variant="overline" numberOfLines={1} style={styles.trendLabel}>
              {kpi.trend.label}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}
