import type { ImageSourcePropType } from 'react-native';
import { Image, View } from 'react-native';

import { ArrowUpIcon } from '@/assets/analytics';
import {
  AvgRunTimeIcon,
  CompletedIcon,
  FailedIcon,
  ScheduledIcon,
  TotalReportsIcon,
  TotalUsersGlyph,
} from '@/assets/reports';
import { AppText } from '@/components/common/AppText';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import {
  kpiCardFill,
  kpiTrendFill,
  reportsHeaderStyles as styles,
} from '@/screens/reports/components/reportsHeaderStyles';
import type { ReportsKpi, ReportsKpis } from '@/screens/reports/reportsData';

export interface ReportsHeaderProps {
  topInset: number;
  firstName: string;
  avatarUrl?: string;
  initialsSource: string;
  isLoading: boolean;
  kpis: ReportsKpis;
  onMenuPress: () => void;
  onSearchPress?: () => void;
  onProfilePress: () => void;
  onRefreshPress: () => void;
}

/**
 * Reports screen's top KPI section:
 * Row 1: Total Reports (full-width with sparkline glyph)
 * Row 2: Completed (left) & Avg, Run Time (right)
 * Row 3: Failed (left) & Scheduled (right)
 * Styled exactly per Figma layout and specifications.
 */
export function ReportsHeader({
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
}: Readonly<ReportsHeaderProps>) {
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
        {/* Full-width top card: Total Reports with sparkline glyph */}
        <TotalReportsCard kpi={kpis.totalReports} isLoading={isLoading} />

        {/* Middle row: Completed & Avg, Run Time */}
        <View style={styles.kpiRow}>
          <KpiCard icon={CompletedIcon} kpi={kpis.completed} isLoading={isLoading} />
          <KpiCard icon={AvgRunTimeIcon} kpi={kpis.avgRunTime} isLoading={isLoading} />
        </View>

        {/* Bottom row: Failed & Scheduled */}
        <View style={styles.kpiRow}>
          <KpiCard icon={FailedIcon} kpi={kpis.failed} isLoading={isLoading} />
          <KpiCard icon={ScheduledIcon} kpi={kpis.scheduled} isLoading={isLoading} />
        </View>
      </View>
    </EdabipAppHeader>
  );
}

function TotalReportsCard({
  kpi,
  isLoading,
}: Readonly<{
  kpi: ReportsKpis['totalReports'];
  isLoading: boolean;
}>) {
  const theme = useTheme();
  const trend = kpi.trend;

  return (
    <View style={[styles.card, styles.totalReportsCard, kpiCardFill(theme.colors.surface)]}>
      <View style={styles.totalReportsLeft}>
        <View style={styles.cardTitleRow}>
          <DashboardIcon icon={TotalReportsIcon} size={18} />
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
            {kpi.label}
          </AppText>
        </View>

        {isLoading ? (
          <View style={styles.skeleton}>
            <Skeleton width="40%" height={14} />
            <Skeleton width="70%" height={12} />
          </View>
        ) : (
          <View style={styles.totalReportsMetrics}>
            <AppText variant="label" style={styles.value}>
              {kpi.value}
            </AppText>
            {trend ? (
              <View
                style={[
                  styles.trend,
                  kpiTrendFill[trend.direction === 'down' ? 'danger' : 'success'],
                ]}
              >
                <View style={trend.direction === 'down' ? styles.trendDown : undefined}>
                  <DashboardIcon icon={ArrowUpIcon} size={8} />
                </View>
                <AppText variant="caption" numberOfLines={1} style={styles.trendLabel}>
                  {`${trend.value} ${trend.note}`}
                </AppText>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {isLoading ? (
        <Skeleton width={155} height={42} style={styles.glyphSkeleton} />
      ) : (
        <Image source={TotalUsersGlyph} style={styles.totalReportsGlyph} resizeMode="contain" />
      )}
    </View>
  );
}

interface KpiCardProps {
  icon: ImageSourcePropType;
  kpi: ReportsKpi;
  isLoading: boolean;
}

function KpiCard({ icon, kpi, isLoading }: Readonly<KpiCardProps>) {
  const theme = useTheme();
  const trend = 'trend' in kpi ? kpi.trend : undefined;
  const subtitle = 'subtitle' in kpi ? kpi.subtitle : undefined;

  return (
    <View style={[styles.card, styles.halfCard, kpiCardFill(theme.colors.surface)]}>
      <View style={styles.cardTitleRow}>
        <DashboardIcon icon={icon} size={18} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.cardTitle}>
          {kpi.label}
        </AppText>
      </View>

      {isLoading ? (
        <View style={styles.skeleton}>
          <Skeleton width="40%" height={14} />
          <Skeleton width="70%" height={12} />
        </View>
      ) : (
        <View style={styles.metrics}>
          <View style={styles.valueCol}>
            <AppText variant="label" style={styles.value}>
              {kpi.value}
            </AppText>
            {subtitle ? (
              <AppText variant="caption" numberOfLines={1} style={styles.cardSubtitle}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {trend ? (
            <View
              style={[
                styles.trend,
                kpiTrendFill[trend.direction === 'down' ? 'danger' : 'success'],
              ]}
            >
              <View style={trend.direction === 'down' ? styles.trendDown : undefined}>
                <DashboardIcon icon={ArrowUpIcon} size={8} />
              </View>
              <AppText variant="caption" numberOfLines={1} style={styles.trendLabel}>
                {`${trend.value} ${trend.note}`}
              </AppText>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
