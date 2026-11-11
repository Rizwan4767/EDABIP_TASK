import { useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import {
  ActivityLogCard,
  type ActivitySearchHandle,
} from '@/screens/dashboard/components/ActivityLogCard';
import { ActiveUsersChart } from '@/screens/dashboard/components/ActiveUsersChart';
import { DashboardHeader } from '@/screens/dashboard/components/DashboardHeader';
import { DataSourcesCard } from '@/screens/dashboard/components/DataSourcesCard';
import { ProductInsightsCard } from '@/screens/dashboard/components/ProductInsightsCard';
import { RevenueForecastChart } from '@/screens/dashboard/components/RevenueForecastChart';
import { dashboardScreenStyles as styles } from '@/screens/dashboard/dashboardScreenStyles';
import { useDashboardData } from '@/screens/dashboard/useDashboardData';
import { IncompleteProfileSheet } from '@/screens/profile-completion/IncompleteProfileSheet';
import { useIncompleteProfilePrompt } from '@/screens/profile-completion/useIncompleteProfilePrompt';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function DashboardScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <DashboardCanvas />
    </ThemeSchemeOverride>
  );
}

function DashboardCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile } = useUser();
  const { data, isLoading, error, reload } = useDashboardData();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<ActivitySearchHandle>(null);
  const { isOpen: isProfilePromptOpen, dismiss: dismissProfilePrompt } =
    useIncompleteProfilePrompt(profile);

  const firstName = getFirstName(profile?.firstName || profile?.fullName || '');

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surface }]}>
      <StatusBar style="light" />
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.colors.surface }]}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.textOnBrand}
          />
        }
      >
        <DashboardHeader
          topInset={insets.top}
          firstName={firstName}
          avatarUrl={profile?.avatarUrl || undefined}
          initialsSource={profile?.fullName ?? ''}
          isLoading={false}
          kpis={data.kpis}
          onMenuPress={() => setMenuOpen(true)}
          onSearchPress={() => searchRef.current?.focusSearch()}
          onProfilePress={() => router.push(ROUTES.main.profile)}
          onRefreshPress={onRefresh}
        />

        <View style={styles.body}>
          {error ? <ErrorBanner message={error} /> : null}

          <RevenueForecastChart points={data.revenueForecast} />
          <ActiveUsersChart points={data.activeUsers} stats={data.userStats} />
          <DataSourcesCard
            stats={data.sourceStats}
            sources={data.dataSources}
            onViewAll={() => router.push(ROUTES.main.more)}
          />
          <ProductInsightsCard items={data.productInsights} />
          <ActivityLogCard ref={searchRef} items={data.recentActivity} />
        </View>
      </ScrollView>

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />

      <IncompleteProfileSheet
        visible={isProfilePromptOpen}
        onDismiss={dismissProfilePrompt}
        onCompleteProfile={() => {
          dismissProfilePrompt();
          router.push(ROUTES.main.settings);
        }}
      />
    </View>
  );
}
