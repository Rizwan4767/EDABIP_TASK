import { useRef, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import { KeyMatrixCard } from '@/screens/tableau/components/KeyMatrixCard';
import { RecentActivityCard } from '@/screens/tableau/components/RecentActivityCard';
import { RevenueCategoryChart } from '@/screens/tableau/components/RevenueCategoryChart';
import { TableauForecastChart } from '@/screens/tableau/components/TableauForecastChart';
import { TableauKpiGrid } from '@/screens/tableau/components/TableauKpiGrid';
import {
  TopDashboardsCard,
  type DashboardSearchHandle,
} from '@/screens/tableau/components/TopDashboardsCard';
import { TrendAnalysisChart } from '@/screens/tableau/components/TrendAnalysisChart';
import { surfaceFill, tableauScreenStyles as styles } from '@/screens/tableau/tableauScreenStyles';
import { useTableauData } from '@/screens/tableau/useTableauData';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function TableauScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <TableauCanvas />
    </ThemeSchemeOverride>
  );
}

function TableauCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile } = useUser();
  const { data, isLoading, error, reload } = useTableauData();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<DashboardSearchHandle>(null);

  const firstName = getFirstName(profile?.fullName ?? '');

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  return (
    <View style={[styles.root, surfaceFill(theme.colors.surface)]}>
      <StatusBar style="light" />
      <ScrollView
        style={[styles.flex, surfaceFill(theme.colors.surface)]}
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
        <EdabipAppHeader
          topInset={insets.top}
          firstName={firstName}
          avatarUrl={profile?.avatarUrl || undefined}
          initialsSource={profile?.fullName ?? ''}
          onMenuPress={() => setMenuOpen(true)}
          onSearchPress={() => searchRef.current?.focusSearch()}
          onProfilePress={() => router.push(ROUTES.main.profile)}
          onRefreshPress={onRefresh}
        >
          <TableauKpiGrid kpis={data.kpis} isLoading={isLoading} />
        </EdabipAppHeader>

        <View style={styles.body}>
          {error ? <ErrorBanner message={error} /> : null}

          <TrendAnalysisChart points={data.trend} />
          <RevenueCategoryChart slices={data.categories} />
          <TableauForecastChart points={data.forecast} />
          <KeyMatrixCard items={data.matrix} />
          <RecentActivityCard items={data.recentActivity} />
          <TopDashboardsCard ref={searchRef} items={data.dashboards} />

          <EdabipLegalFooter />
        </View>
      </ScrollView>

      <EdabipAppSidebar
        visible={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}
