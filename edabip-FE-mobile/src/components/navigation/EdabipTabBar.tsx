import type { ImageSourcePropType } from 'react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TabAnalyticsIcon,
  TabHomeIcon,
  TabPowerBiIcon,
  TabReportIcon,
  TabTableauIcon,
} from '@/assets/dashboard';
import { AppText } from '@/components/common/AppText';
import { edabipTabBarStyles as styles } from '@/components/navigation/edabipTabBarStyles';
import { useTheme } from '@/hooks/useTheme';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';

const TABS: Record<string, { label: string; icon: ImageSourcePropType }> = {
  dashboard: { label: 'Dashboard', icon: TabHomeIcon },
  powerbi: { label: 'Power BI', icon: TabPowerBiIcon },
  tableau: { label: 'Tableau', icon: TabTableauIcon },
  analytics: { label: 'Analytics', icon: TabAnalyticsIcon },
  reports: { label: 'Report', icon: TabReportIcon },
};

export interface EdabipTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<string, { options: { tabBarAccessibilityLabel?: string } }>;
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
}

/**
 * Shared Figma footer used by every primary tab: Dashboard, Power BI,
 * Tableau, Analytics, and Report.
 */
export function EdabipTabBar({ state, descriptors, navigation }: Readonly<EdabipTabBarProps>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, { backgroundColor: theme.palette.white }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.palette.teal700,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ]}
      >
        {state.routes
          .filter((route) => TABS[route.name])
          .map((route) => {
            const focused = state.routes[state.index]?.name === route.name;
            const meta = TABS[route.name] ?? { label: route.name, icon: TabHomeIcon };
            const options = descriptors[route.key]?.options;
            const color = focused ? theme.palette.white : '#8B9595';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) return;
              // Power BI always opens the report list; analytics pages come from View Report.
              if (route.name === 'powerbi') {
                navigation.navigate(route.name, { screen: 'index' });
                return;
              }
              if (!focused) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options?.tabBarAccessibilityLabel ?? meta.label}
                style={styles.item}
              >
                {focused ? (
                  <View style={styles.indicator} />
                ) : (
                  <View style={styles.indicatorSlot} />
                )}
                <DashboardIcon icon={meta.icon} size={28} color={color} />
                <AppText
                  variant="caption"
                  style={[styles.label, { color, fontFamily: theme.typography.fontFamily.regular }]}
                >
                  {meta.label}
                </AppText>
              </Pressable>
            );
          })}
      </View>
    </View>
  );
}
