import { Pressable, ScrollView } from 'react-native';

import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { POWER_BI_TABS, type PowerBiTabId } from '@/screens/powerbi/powerBiData';
import { powerBiAnalyticsTabsStyles as styles } from '@/screens/powerbi/components/powerBiAnalyticsTabsStyles';

export function PowerBiAnalyticsTabs({
  activeId,
  onChange,
}: Readonly<{
  activeId: PowerBiTabId;
  onChange: (id: PowerBiTabId) => void;
}>) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
      accessibilityRole="tablist"
      accessibilityLabel="Power BI analytics pages"
    >
      {POWER_BI_TABS.map((tab) => {
        const active = tab.id === activeId;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={[styles.tab, active ? styles.tabActive : null]}
          >
            <AppText
              variant="label"
              style={[styles.label, { fontFamily: theme.typography.fontFamily.semibold }]}
            >
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
