import { Pressable, View } from 'react-native';

import { KebabDotsIcon, KebabIcon, ReportFileIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { ProductInsight } from '@/screens/dashboard/dashboardData';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { productInsightsCardStyles as styles } from '@/screens/dashboard/components/productInsightsCardStyles';
import { StatusPill } from '@/screens/dashboard/components/StatusPill';

export function ProductInsightsCard({ items }: Readonly<{ items: ProductInsight[] }>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="h3">Recent Activity</AppText>
        <View style={styles.headerRight}>
          <AppText variant="caption" color="textSecondary">
            Total Product Insights
          </AppText>
          <DashboardIcon icon={KebabIcon} size={18} />
        </View>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={[styles.row, { borderColor: '#CFC9C9' }]}>
            <DashboardIcon icon={ReportFileIcon} size={20} />
            <View style={styles.copy}>
              <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="overline" color="textMuted" style={styles.when}>
                {item.when}
              </AppText>
            </View>
            <StatusPill status={item.status} />
            <Pressable
              hitSlop={theme.dimensions.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Actions for ${item.title}`}
            >
              <DashboardIcon icon={KebabDotsIcon} width={10} height={10} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
