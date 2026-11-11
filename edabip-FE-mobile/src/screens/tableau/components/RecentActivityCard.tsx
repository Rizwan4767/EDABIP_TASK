import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { TableauActivityItem } from '@/screens/tableau/tableauData';
import {
  chartCardFill,
  recentActivityCardStyles as styles,
} from '@/screens/tableau/components/recentActivityCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export function RecentActivityCard({ items }: Readonly<{ items: TableauActivityItem[] }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Recent Activity
        </AppText>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <DashboardIcon icon={item.icon} width={28} height={30} />
            <View style={styles.copy}>
              <AppText variant="bodyStrong" numberOfLines={1} style={styles.name}>
                {item.title}
              </AppText>
              <AppText variant="caption" numberOfLines={1} style={styles.sub}>
                {item.subtitle}
              </AppText>
            </View>
            <AppText variant="caption" style={styles.time}>
              {item.time}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
