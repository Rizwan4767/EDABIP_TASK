import { View } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { statusPillStyles as styles } from '@/screens/dashboard/components/statusPillStyles';
import type { SourceStatus } from '@/screens/dashboard/dashboardData';

export function StatusPill({ status }: Readonly<{ status: SourceStatus }>) {
  const theme = useTheme();
  const isActive = status === 'Active';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: isActive ? theme.palette.teal50 : '#F9E9ED',
          borderColor: isActive ? theme.colors.success : theme.colors.danger,
        },
      ]}
    >
      <AppText
        variant="overline"
        style={[
          styles.label,
          { color: theme.colors.text, textTransform: 'none', letterSpacing: 0 },
        ]}
      >
        {status}
      </AppText>
    </View>
  );
}
