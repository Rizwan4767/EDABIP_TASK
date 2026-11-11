import { Pressable, View } from 'react-native';

import { KebabDotsIcon, ReportTemplateIcon } from '@/assets/reports';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { recentReportsCardStyles as styles } from '@/screens/reports/components/recentReportsCardStyles';
import { ReportStatusPill } from '@/screens/reports/components/ReportStatusPill';
import type { RecentReport } from '@/screens/reports/reportsData';

export function RecentReportsCard({
  reports,
  onOpenActions,
}: Readonly<{
  reports: RecentReport[];
  onOpenActions?: (report: RecentReport) => void;
}>) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.header}>
        <AppText variant="h3">Recent Reports</AppText>
      </View>

      <View style={styles.list}>
        {reports.map((report) => (
          <View key={report.id} style={[styles.row, { borderColor: '#CFC9C9' }]}>
            <DashboardIcon icon={ReportTemplateIcon} size={22} />
            <View style={styles.copy}>
              <AppText variant="caption" numberOfLines={1}>
                {report.title}
              </AppText>
              <AppText
                variant="overline"
                color="textMuted"
                style={styles.subtitle}
                numberOfLines={1}
              >
                {report.subtitle}
              </AppText>
            </View>
            <ReportStatusPill status={report.status} />
            <Pressable
              onPress={() => onOpenActions?.(report)}
              hitSlop={theme.dimensions.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Actions for ${report.title}`}
            >
              <DashboardIcon icon={KebabDotsIcon} width={10} height={10} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
