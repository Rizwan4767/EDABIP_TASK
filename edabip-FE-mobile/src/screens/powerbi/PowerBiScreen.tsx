import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import type { AppFilterValue } from '@/components/modals/FilterSheet';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES, powerBiReportHref } from '@/navigation/routes';
import { PowerBiReportCard } from '@/screens/powerbi/components/PowerBiReportCard';
import { PowerBiReportListSkeleton } from '@/screens/powerbi/components/PowerBiReportListSkeleton';
import { powerBiScreenStyles as styles } from '@/screens/powerbi/powerBiScreenStyles';
import { usePowerBiReports } from '@/screens/powerbi/usePowerBiReports';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function PowerBiScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <PowerBiCanvas />
    </ThemeSchemeOverride>
  );
}

function PowerBiCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, reload: reloadProfile } = useUser();
  const { reports, isLoading, isRefreshing, error, reload } = usePowerBiReports();
  const [menuOpen, setMenuOpen] = useState(false);
  const [appliedFilter, setAppliedFilter] = useState<AppFilterValue | null>(null);

  const firstName = getFirstName(profile?.fullName ?? '');
  const visibleReports = useMemo(() => {
    const selected = appliedFilter?.categories ?? [];
    if (selected.length === 0) return reports;
    return reports.filter((report) => selected.some((category) => category === report.id));
  }, [appliedFilter, reports]);

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="light" />
      <ScrollView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
          onProfilePress={() => router.push(ROUTES.main.profile)}
          onRefreshPress={onRefresh}
          filterMode="categories"
          onApplyFilter={setAppliedFilter}
        />

        <View style={styles.body}>
          {error ? <ErrorBanner message={error} /> : null}

          {isLoading ? (
            <PowerBiReportListSkeleton />
          ) : (
            <View style={styles.list} accessibilityLabel="Power BI reports">
              {visibleReports.length === 0 ? (
                <EmptyState
                  title="No reports match this filter"
                  description="Reset the category filter to see every Power BI report again."
                  icon="funnel-outline"
                />
              ) : (
                visibleReports.map((report) => (
                  <PowerBiReportCard
                    key={report.id}
                    report={report}
                    onViewPress={() => router.push(powerBiReportHref(report.id))}
                  />
                ))
              )}
            </View>
          )}

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
