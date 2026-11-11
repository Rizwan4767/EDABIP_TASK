import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES } from '@/navigation/routes';
import {
  analyticsScreenStyles as styles,
  surfaceFill,
} from '@/screens/analytics/analyticsScreenStyles';
import { AnalyticsHeader } from '@/screens/analytics/components/AnalyticsHeader';
import { AnalyticsRevenueForecastChart } from '@/screens/analytics/components/AnalyticsRevenueForecastChart';
import { DemandPredictionChart } from '@/screens/analytics/components/DemandPredictionChart';
import { MlModelRegistryCard } from '@/screens/analytics/components/MlModelRegistryCard';
import { useAnalyticsData } from '@/screens/analytics/useAnalyticsData';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function AnalyticsScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <AnalyticsCanvas />
    </ThemeSchemeOverride>
  );
}

function AnalyticsCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile } = useUser();
  const { data, isLoading, error, reload } = useAnalyticsData();
  const [menuOpen, setMenuOpen] = useState(false);

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
        <AnalyticsHeader
          topInset={insets.top}
          firstName={firstName}
          avatarUrl={profile?.avatarUrl || undefined}
          initialsSource={profile?.fullName ?? ''}
          isLoading={isLoading}
          kpis={data.kpis}
          onMenuPress={() => setMenuOpen(true)}
          onProfilePress={() => router.push(ROUTES.main.profile)}
          onRefreshPress={onRefresh}
        />

        <View style={styles.body}>
          {error ? <ErrorBanner message={error} /> : null}

          <AnalyticsRevenueForecastChart points={data.revenueForecast} />
          <DemandPredictionChart points={data.demandPrediction} />
          <MlModelRegistryCard models={data.models} isLoading={isLoading} />

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
