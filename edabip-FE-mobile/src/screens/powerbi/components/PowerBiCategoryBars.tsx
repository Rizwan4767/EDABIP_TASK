import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import {
  chartCardFill,
  powerBiSharedChartStyles as styles,
} from '@/screens/powerbi/components/powerBiSharedChartStyles';
import type { PowerBiCategoryBar } from '@/screens/powerbi/powerBiData';

export function PowerBiCategoryBars({
  title,
  bars,
}: Readonly<{
  title: string;
  bars: PowerBiCategoryBar[];
}>) {
  const theme = useTheme();
  const max = Math.max(1, ...bars.map((bar) => bar.value));

  return (
    <View
      style={[styles.card, chartCardFill(theme.colors.surface, theme.palette.grey100)]}
      accessibilityLabel={`${title}, ${bars
        .map((bar) => `${bar.label} ${bar.displayValue}`)
        .join(', ')}`}
    >
      <View style={styles.header}>
        <AppText variant="h3" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
      </View>

      <View style={styles.bars}>
        {bars.map((bar) => (
          <View key={bar.id} style={styles.barCol}>
            <AppText variant="caption" style={styles.barValue}>
              {bar.displayValue}
            </AppText>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: Math.max(8, (bar.value / max) * 110),
                    backgroundColor: bar.color,
                  },
                ]}
              />
            </View>
            <AppText variant="caption" style={styles.barLabel} numberOfLines={1}>
              {bar.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
