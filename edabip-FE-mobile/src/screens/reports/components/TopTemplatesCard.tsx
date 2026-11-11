import { Pressable, View } from 'react-native';

import { ChevronDownIcon, KebabDotsIcon, ReportTemplateIcon } from '@/assets/reports';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { topTemplatesCardStyles as styles } from '@/screens/reports/components/topTemplatesCardStyles';
import type { ReportTemplate } from '@/screens/reports/reportsData';

export function TopTemplatesCard({
  templates,
  onViewAll,
  onUseTemplate,
}: Readonly<{
  templates: ReportTemplate[];
  onViewAll?: () => void;
  onUseTemplate?: (template: ReportTemplate) => void;
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
        <AppText variant="h3">Top Report Templates</AppText>
        <Pressable
          onPress={onViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all templates"
          style={styles.viewAll}
        >
          <AppText variant="caption" color="textSecondary">
            View All
          </AppText>
          <DashboardIcon icon={ChevronDownIcon} size={12} />
        </Pressable>
      </View>

      <View style={styles.list}>
        {templates.map((template) => (
          <View key={template.id} style={[styles.row, { borderColor: '#CFC9C9' }]}>
            <DashboardIcon icon={ReportTemplateIcon} size={22} />
            <View style={styles.copy}>
              <AppText variant="caption" numberOfLines={1}>
                {template.title}
              </AppText>
              <AppText variant="overline" color="textMuted" style={styles.when}>
                {template.when}
              </AppText>
            </View>
            <Pressable
              onPress={() => onUseTemplate?.(template)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${template.title}`}
              style={[
                styles.useButton,
                { backgroundColor: theme.palette.teal50, borderColor: theme.colors.success },
              ]}
            >
              <AppText variant="label" color="success" style={styles.useLabel}>
                Use
              </AppText>
            </Pressable>
            <Pressable
              hitSlop={theme.dimensions.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Actions for ${template.title}`}
            >
              <DashboardIcon icon={KebabDotsIcon} width={10} height={10} />
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
