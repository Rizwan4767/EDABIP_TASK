import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import type { BillingKpi } from '@/screens/billing/billingData';
import {
  billingKpiGridStyles as styles,
  kpiCardFill,
} from '@/screens/billing/components/billingKpiGridStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export function BillingKpiGrid({
  kpis,
  isLoading,
}: Readonly<{ kpis: BillingKpi[]; isLoading: boolean }>) {
  return (
    <View style={styles.grid} accessibilityLabel="Billing summary">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} isLoading={isLoading} />
      ))}
    </View>
  );
}

function KpiCard({ kpi, isLoading }: Readonly<{ kpi: BillingKpi; isLoading: boolean }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, kpiCardFill(theme.colors.surface)]}>
      <View style={styles.titleRow}>
        <DashboardIcon icon={kpi.icon} size={19} />
        <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {kpi.title}
        </AppText>
      </View>
      {isLoading ? (
        <View style={styles.skeleton}>
          <Skeleton width="48%" height={16} />
          <Skeleton width="70%" height={12} />
        </View>
      ) : (
        <View style={styles.values}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.value}>
            {kpi.value}
          </AppText>
          <View
            style={[styles.badge, kpi.tone === 'danger' ? styles.badgeDanger : styles.badgeSuccess]}
          >
            <AppText variant="overline" style={styles.badgeLabel}>
              {kpi.badge}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}
