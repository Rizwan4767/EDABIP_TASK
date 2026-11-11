import { Image, View } from 'react-native';

import { WorldMapImage } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import type { SalesRegion } from '@/screens/powerbi/powerBiData';
import {
  chartCardFill,
  mapDotPos,
  regionBarFill,
  salesByRegionCardStyles as styles,
} from '@/screens/powerbi/components/salesByRegionCardStyles';

export function SalesByRegionCard({ regions }: Readonly<{ regions: SalesRegion[] }>) {
  const theme = useTheme();
  const maxValue = Math.max(...regions.map((region) => region.amount), 1);
  const top = regions.filter((_, index) => index < 2);
  const bottom = regions.filter((_, index) => index >= 2);

  return (
    <View style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}>
      <AppText variant="h3" style={styles.title}>
        Sales by Region
      </AppText>

      <View style={styles.mapWrap}>
        <Image
          source={WorldMapImage}
          resizeMode="contain"
          style={styles.map}
          accessibilityLabel="Sales by region map"
        />
        {regions.map((region) => (
          <View key={region.name} style={[styles.dot, mapDotPos(region.x, region.y)]} />
        ))}
      </View>

      <View style={styles.legend} accessibilityLabel="Sales by region">
        <LegendRow items={top} maxValue={maxValue} />
        <LegendRow items={bottom} maxValue={maxValue} />
      </View>
    </View>
  );
}

function LegendRow({ items, maxValue }: Readonly<{ items: SalesRegion[]; maxValue: number }>) {
  return (
    <View style={styles.legendRow}>
      {items.map((region) => (
        <View key={region.name} style={styles.legendItem}>
          <View style={styles.legendText}>
            <AppText variant="body" style={styles.city}>
              {region.name}
            </AppText>
            <AppText variant="bodyStrong" style={styles.amount}>
              {region.value}
            </AppText>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, regionBarFill((region.amount / maxValue) * 100)]} />
          </View>
        </View>
      ))}
    </View>
  );
}
