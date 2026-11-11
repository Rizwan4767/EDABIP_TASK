import { View } from 'react-native';

import { Skeleton } from '@/components/loaders/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { powerBiReportCardStyles as cardStyles } from '@/screens/powerbi/components/powerBiReportCardStyles';
import { powerBiScreenStyles as styles } from '@/screens/powerbi/powerBiScreenStyles';

const CARD_COUNT = 5;

export function PowerBiReportListSkeleton() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Loading Power BI reports"
      accessibilityRole="progressbar"
      style={styles.skeleton}
    >
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            cardStyles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.palette.grey100,
            },
            theme.shadows.sm,
          ]}
        >
          <View style={cardStyles.header}>
            <Skeleton width={32} height={32} radius={4} />
            <Skeleton width="62%" height={16} />
          </View>
          <View style={styles.skeletonCopy}>
            <Skeleton width="100%" height={12} />
            <Skeleton width="82%" height={12} />
          </View>
          <View style={cardStyles.footer}>
            <Skeleton width={120} height={13} />
            <Skeleton width={114} height={28} radius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}
