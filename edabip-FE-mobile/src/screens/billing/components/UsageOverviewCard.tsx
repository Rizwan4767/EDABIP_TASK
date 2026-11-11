import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { BillingUsageItem } from '@/screens/billing/billingData';
import {
  chartCardFill,
  usageFill,
  usageOverviewCardStyles as styles,
} from '@/screens/billing/components/usageOverviewCardStyles';

export function UsageOverviewCard({ items }: Readonly<{ items: BillingUsageItem[] }>) {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, '#CFC9C9')]}
      accessibilityLabel="Usage overview"
    >
      <AppText variant="h3" style={styles.title}>
        Usage Overview (Current Period)
      </AppText>
      <View style={styles.list}>
        {items.map((item) => (
          <View
            key={item.id}
            style={styles.row}
            accessibilityLabel={`${item.label} ${item.percent}%`}
          >
            <View style={styles.labelRow}>
              <AppText variant="bodyStrong" style={styles.label}>
                {item.label}
              </AppText>
              <AppText variant="label" style={styles.percent}>
                {item.percent}%
              </AppText>
            </View>
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: item.percent }}
            >
              <View style={[styles.fill, usageFill(item.percent)]} />
            </View>
            <View style={styles.metaRow}>
              <AppText variant="caption" style={styles.meta}>
                {item.value}
              </AppText>
              <AppText variant="caption" style={styles.limit}>
                {item.limit}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
