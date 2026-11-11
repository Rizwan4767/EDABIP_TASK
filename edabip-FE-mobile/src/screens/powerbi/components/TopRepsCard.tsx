import { Pressable, View } from 'react-native';

import { ChevronDownIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import type { SalesRep } from '@/screens/powerbi/powerBiData';
import {
  chartCardFill,
  topRepsCardStyles as styles,
} from '@/screens/powerbi/components/topRepsCardStyles';

export function TopRepsCard({ reps }: Readonly<{ reps: SalesRep[] }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Top Reps
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="View all top reps"
          style={styles.viewAll}
        >
          <AppText variant="overline" style={styles.viewAllLabel}>
            View All
          </AppText>
          <DashboardIcon icon={ChevronDownIcon} width={10} height={6} />
        </Pressable>
      </View>

      <View style={styles.list} accessibilityLabel="Top sales representatives">
        {reps.map((rep) => (
          <View key={rep.id} style={styles.row}>
            <View style={styles.rowInner}>
              <View style={styles.col}>
                <AppText variant="overline" style={styles.label}>
                  Rep Name
                </AppText>
                <AppText variant="bodyStrong" style={styles.value}>
                  {rep.name}
                </AppText>
              </View>
              <View style={[styles.col, styles.revenueCol]}>
                <AppText variant="overline" style={styles.label}>
                  Revenue
                </AppText>
                <AppText variant="bodyStrong" style={styles.value}>
                  {rep.revenue}
                </AppText>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
