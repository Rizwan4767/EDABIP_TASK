import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { reportStatusPillStyles as styles } from '@/screens/reports/components/reportStatusPillStyles';
import type { ReportStatus } from '@/screens/reports/reportsData';

export function ReportStatusPill({ status }: Readonly<{ status: ReportStatus }>) {
  const theme = useTheme();

  const tone =
    status === 'Completed'
      ? { bg: theme.palette.teal50, border: theme.colors.success, text: theme.colors.text }
      : status === 'Failed'
        ? { bg: '#F9E9ED', border: theme.colors.danger, text: theme.colors.danger }
        : { bg: '#EAF1FE', border: '#AFC9F9', text: theme.colors.text };

  return (
    <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <AppText
        variant="overline"
        style={[styles.label, { color: tone.text, textTransform: 'none', letterSpacing: 0 }]}
      >
        {status}
      </AppText>
    </View>
  );
}
