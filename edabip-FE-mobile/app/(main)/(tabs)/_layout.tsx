import { Tabs } from 'expo-router';

import { EdabipTabBar, type EdabipTabBarProps } from '@/components/navigation/EdabipTabBar';
import { palette } from '@/theme';

export const unstable_settings = { initialRouteName: 'dashboard' };

function MainTabBar(props: EdabipTabBarProps) {
  return <EdabipTabBar {...props} />;
}

/**
 * Primary navigation matching the Figma mobile footer: Dashboard, Power BI,
 * Tableau, Analytics, Report. The same `EdabipTabBar` is shared across these
 * tabs. Users, billing, AI, and settings live in the left hamburger sidebar.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={MainTabBar}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: palette.white },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="powerbi" options={{ title: 'Power BI' }} />
      <Tabs.Screen name="tableau" options={{ title: 'Tableau' }} />
      <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Tabs.Screen name="reports" options={{ title: 'Report' }} />
    </Tabs>
  );
}
