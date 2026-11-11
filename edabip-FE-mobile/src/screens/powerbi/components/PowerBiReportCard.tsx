import { Pressable, View } from 'react-native';

import { PbiClockIcon } from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { powerBiReportCardStyles as styles } from '@/screens/powerbi/components/powerBiReportCardStyles';
import type { PowerBiReport } from '@/screens/powerbi/powerBiData';

export function PowerBiReportCard({
  report,
  onViewPress,
}: Readonly<{
  report: PowerBiReport;
  onViewPress: () => void;
}>) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onViewPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${report.title}`}
      android_ripple={{ color: 'rgba(19, 75, 74, 0.08)' }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.palette.grey100,
          opacity: pressed ? 0.96 : 1,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={styles.header}>
        <DashboardIcon icon={report.icon} width={32} height={32} />
        <AppText variant="bodyStrong" numberOfLines={2} style={styles.title}>
          {report.title}
        </AppText>
      </View>

      <AppText variant="caption" color="textSecondary" style={styles.description}>
        {report.description}
      </AppText>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <DashboardIcon icon={PbiClockIcon} size={18} />
          <AppText
            variant="caption"
            color="textSecondary"
            style={styles.metaText}
            numberOfLines={1}
          >
            {`Last Refreshed: ${report.refreshed}`}
          </AppText>
        </View>

        <View style={[styles.button, { backgroundColor: theme.colors.brand }]}>
          <AppText
            variant="button"
            color="textOnBrand"
            style={[styles.buttonLabel, { fontFamily: theme.typography.fontFamily.semibold }]}
          >
            View Report
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}
