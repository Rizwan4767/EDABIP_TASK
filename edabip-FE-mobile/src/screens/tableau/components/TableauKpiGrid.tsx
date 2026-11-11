import { View } from 'react-native';

import { ArrowDownIcon, ArrowUpIcon } from '@/assets/tableau';
import { AppText } from '@/components/common/AppText';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import type { TableauKpi } from '@/screens/tableau/tableauData';
import {
  kpiCardFill,
  tableauKpiGridStyles as styles,
} from '@/screens/tableau/components/tableauKpiGridStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export function TableauKpiGrid({
  kpis,
  isLoading,
}: Readonly<{ kpis: TableauKpi[]; isLoading: boolean }>) {
  return (
    <View style={styles.grid} accessibilityLabel="Key metrics">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} isLoading={isLoading} />
      ))}
    </View>
  );
}

function KpiCard({ kpi, isLoading }: Readonly<{ kpi: TableauKpi; isLoading: boolean }>) {
  const theme = useTheme();
  const changeColor = kpi.positive ? theme.colors.success : theme.colors.danger;

  return (
    <View style={[styles.card, kpiCardFill(theme.colors.surface)]}>
      <View style={styles.titleRow}>
        <DashboardIcon icon={kpi.icon} width={28} height={29} />
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
        <>
          <AppText variant="h3" style={styles.value}>
            {kpi.value}
          </AppText>
          <View style={styles.changeRow}>
            <DashboardIcon icon={kpi.positive ? ArrowUpIcon : ArrowDownIcon} size={10} />
            <AppText variant="label" style={[styles.change, { color: changeColor }]}>
              {kpi.positive ? '↑' : '↓'} {kpi.change}
            </AppText>
            <AppText variant="overline" color="textMuted" style={styles.note}>
              {kpi.changeNote}
            </AppText>
          </View>
        </>
      )}
    </View>
  );
}
