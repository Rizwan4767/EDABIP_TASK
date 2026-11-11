import { Image, Pressable, View } from 'react-native';

import { KebabIcon } from '@/assets/dashboard';
import { TrendDownIcon, TrendUpIcon } from '@/assets/tableau';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { TableauMatrixItem } from '@/screens/tableau/tableauData';
import {
  chartCardFill,
  keyMatrixCardStyles as styles,
} from '@/screens/tableau/components/keyMatrixCardStyles';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

export function KeyMatrixCard({ items }: Readonly<{ items: TableauMatrixItem[] }>) {
  const theme = useTheme();

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.colors.border)]}>
      <View style={styles.header}>
        <AppText variant="h3" style={styles.title}>
          Key Matrix
        </AppText>
        <Pressable
          hitSlop={theme.dimensions.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Key matrix actions"
        >
          <DashboardIcon icon={KebabIcon} width={3} height={13} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <View style={styles.itemHead}>
              <AppText variant="bodyStrong" numberOfLines={2} style={styles.label}>
                {item.label}
              </AppText>
              <View style={[styles.change, item.positive ? styles.changeUp : styles.changeDown]}>
                <DashboardIcon icon={item.positive ? TrendUpIcon : TrendDownIcon} size={10} />
                <AppText variant="overline" style={styles.changeLabel}>
                  {item.change}
                </AppText>
              </View>
            </View>
            <View style={styles.body}>
              <AppText variant="h3" style={styles.value}>
                {item.value}
              </AppText>
              <Image source={item.spark} resizeMode="contain" style={styles.spark} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
