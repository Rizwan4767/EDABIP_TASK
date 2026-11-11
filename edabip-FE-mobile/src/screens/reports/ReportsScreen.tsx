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
import { ReportsHeader } from '@/screens/reports/components/ReportsHeader';
import { useReportsData } from '@/screens/reports/useReportsData';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';
import { ReportsDemandChart } from '@/screens/reports/components/ReportsDemandChart';
import { reportsScreenStyles as styles } from '@/screens/reports/reportsScreenStyles';
import { ReportStatusDonut } from '@/screens/reports/components/ReportStatusDonut';
import { TopTemplatesCard } from '@/screens/reports/components/TopTemplatesCard';
import { RecentReportsCard } from '@/screens/reports/components/RecentReportsCard';
import { RecentActivityCard } from '@/screens/reports/components/RecentActivityCard';

export function ReportsScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <ReportsCanvas />
    </ThemeSchemeOverride>
  );
}

function ReportsCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUser();
  const { data, isLoading, error, reload } = useReportsData();
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = getFirstName(profile?.fullName ?? '');

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surface }]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={reload}
            tintColor={theme.colors.textOnBrand}
          />
        }
      >
        <ReportsHeader
          topInset={insets.top}
          firstName={firstName}
          avatarUrl={profile?.avatarUrl || undefined}
          initialsSource={profile?.fullName ?? ''}
          isLoading={false}
          kpis={data.kpis}
          onMenuPress={() => setMenuOpen(true)}
          onProfilePress={() => router.push(ROUTES.main.profile)}
          onRefreshPress={reload}
        />

        <View style={styles.body}>
          {error ? <ErrorBanner message={error} /> : null}
          <ReportsDemandChart points={data.demandPrediction} />
          <ReportStatusDonut slices={data.statusBreakdown} />
          <TopTemplatesCard templates={data.templates} />
          <RecentReportsCard reports={data.recentReports} />
          <RecentActivityCard items={data.recentActivity} />

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
