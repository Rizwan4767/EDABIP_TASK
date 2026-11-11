import { View, type ImageSourcePropType } from 'react-native';

import { ArrowDownRedIcon, ArrowUpIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { SalesKpi, SalesKpiTone } from '@/screens/powerbi/powerBiData';
import {
  kpiBadgeFill,
  kpiCardFill,
  powerBiKpiGridStyles as styles,
} from '@/screens/powerbi/components/powerBiKpiGridStyles';

function badgeIconFor(tone: SalesKpiTone, badgeIcon?: ImageSourcePropType) {
  if (badgeIcon) return badgeIcon;
  return tone === 'down' ? ArrowDownRedIcon : ArrowUpIcon;
}

export function PowerBiKpiGrid({
  kpis,
  isLoading,
  accessibilityLabel = 'Key metrics',
}: Readonly<{ kpis: SalesKpi[]; isLoading: boolean; accessibilityLabel?: string }>) {
  return (
    <View style={styles.grid} accessibilityLabel={accessibilityLabel}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} isLoading={isLoading} />
      ))}
    </View>
  );
}

function KpiCard({ kpi, isLoading }: Readonly<{ kpi: SalesKpi; isLoading: boolean }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, kpiCardFill(theme.colors.surface), theme.shadows.sm]}>
      <View style={styles.titleRow}>
        <DashboardIcon icon={kpi.icon} width={kpi.iconWidth ?? 18} height={kpi.iconHeight ?? 18} />
        <AppText
          variant="bodyStrong"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={styles.title}
        >
          {kpi.title}
        </AppText>
      </View>
      {isLoading ? (
        <View style={styles.skeleton}>
          <Skeleton width="70%" height={16} />
        </View>
      ) : (
        <View style={styles.valueRow}>
          <AppText variant="bodyStrong" style={styles.value}>
            {kpi.value}
          </AppText>
          <View style={[styles.badge, kpiBadgeFill[kpi.tone]]}>
            <DashboardIcon icon={badgeIconFor(kpi.tone, kpi.badgeIcon)} size={8} />
            <AppText variant="overline" numberOfLines={1} style={styles.change}>
              {kpi.change}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}
