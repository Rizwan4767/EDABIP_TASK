import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/common/AppText';
import { ErrorBanner } from '@/components/common/ErrorState';
import { EdabipAppHeader } from '@/components/layout/EdabipAppHeader';
import { EdabipLegalFooter } from '@/components/layout/EdabipLegalFooter';
import { EdabipAppSidebar } from '@/components/navigation/EdabipAppSidebar';
import { ThemeSchemeOverride, useTheme } from '@/hooks/useTheme';
import { ROUTES, powerBiReportHref } from '@/navigation/routes';
import { CustomerAnalyticsCharts } from '@/screens/powerbi/components/CustomerAnalyticsCharts';
import { DailySalesTrendChart } from '@/screens/powerbi/components/DailySalesTrendChart';
import { FinancialAnalyticsCharts } from '@/screens/powerbi/components/FinancialAnalyticsCharts';
import { HrAnalyticsCharts } from '@/screens/powerbi/components/HrAnalyticsCharts';
import { MonthlyRevenueChart } from '@/screens/powerbi/components/MonthlyRevenueChart';
import { OperationsAnalyticsCharts } from '@/screens/powerbi/components/OperationsAnalyticsCharts';
import { PowerBiAnalyticsTabs } from '@/screens/powerbi/components/PowerBiAnalyticsTabs';
import { PowerBiKpiGrid } from '@/screens/powerbi/components/PowerBiKpiGrid';
import { SalesByRegionCard } from '@/screens/powerbi/components/SalesByRegionCard';
import { TopRepsCard } from '@/screens/powerbi/components/TopRepsCard';
import {
  CUSTOMER_ANALYTICS_DATA,
  FINANCIAL_ANALYTICS_DATA,
  HR_ANALYTICS_DATA,
  OPERATIONS_ANALYTICS_DATA,
  POWER_BI_REPORTS,
  isPowerBiTabId,
  type PowerBiTabId,
  type SalesAnalyticsData,
  type SalesKpi,
} from '@/screens/powerbi/powerBiData';
import { powerBiScreenStyles as styles, surfaceFill } from '@/screens/powerbi/powerBiScreenStyles';
import { usePowerBiAnalytics } from '@/screens/powerbi/usePowerBiAnalytics';
import { useUser } from '@/store/user';
import { getFirstName } from '@/utils/format';

export function PowerBiAnalyticsScreen() {
  return (
    <ThemeSchemeOverride scheme="light">
      <PowerBiAnalyticsCanvas />
    </ThemeSchemeOverride>
  );
}

function PowerBiAnalyticsCanvas() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId?: string | string[] }>();
  const reportId = Array.isArray(params.reportId) ? params.reportId[0] : params.reportId;
  const { profile, reload: reloadProfile } = useUser();
  const { data, isLoading, isRefreshing, error, reload } = usePowerBiAnalytics();
  const [menuOpen, setMenuOpen] = useState(false);

  const tab: PowerBiTabId | null = isPowerBiTabId(reportId) ? reportId : null;
  const firstName = getFirstName(profile?.fullName ?? '');
  const activeReport = POWER_BI_REPORTS.find((report) => report.id === tab);

  useEffect(() => {
    if (!tab) {
      router.replace(ROUTES.main.powerBi);
    }
  }, [router, tab]);

  const onRefresh = () => {
    void Promise.all([reload(), reloadProfile()]);
  };

  const onTabChange = (id: PowerBiTabId) => {
    if (id === tab) return;
    router.replace(powerBiReportHref(id));
  };

  const kpis = kpisForTab(tab, data.kpis);

  if (!tab || !activeReport) {
    return null;
  }

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
        >
          <Pressable
            onPress={() => router.replace(ROUTES.main.powerBi)}
            accessibilityRole="button"
            accessibilityLabel="Back to Power BI reports"
            hitSlop={theme.dimensions.hitSlop}
            style={styles.backRow}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.textOnBrand} />
            <AppText variant="bodyStrong" style={styles.backLabel} numberOfLines={1}>
              {activeReport.title.replace(' 2026', '')}
            </AppText>
          </Pressable>
          <PowerBiKpiGrid
            kpis={kpis}
            isLoading={tab === 'sales' ? isLoading : false}
            accessibilityLabel={`${activeReport.title} key metrics`}
          />
          <PowerBiAnalyticsTabs activeId={tab} onChange={onTabChange} />
        </EdabipAppHeader>

        <View style={styles.body}>
          {error && tab === 'sales' ? <ErrorBanner message={error} /> : null}
          <ReportBody tab={tab} sales={data} />
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

function kpisForTab(tab: PowerBiTabId | null, salesKpis: SalesKpi[]): SalesKpi[] {
  if (tab === 'financial') return FINANCIAL_ANALYTICS_DATA.kpis;
  if (tab === 'customer') return CUSTOMER_ANALYTICS_DATA.kpis;
  if (tab === 'hr') return HR_ANALYTICS_DATA.kpis;
  if (tab === 'operations') return OPERATIONS_ANALYTICS_DATA.kpis;
  return salesKpis;
}

function ReportBody({ tab, sales }: Readonly<{ tab: PowerBiTabId; sales: SalesAnalyticsData }>) {
  if (tab === 'sales') {
    return (
      <>
        <DailySalesTrendChart points={sales.dailyTrend} />
        <MonthlyRevenueChart bars={sales.monthlyRevenue} />
        <SalesByRegionCard regions={sales.regions} />
        <TopRepsCard reps={sales.topReps} />
      </>
    );
  }

  if (tab === 'financial') {
    return <FinancialAnalyticsCharts data={FINANCIAL_ANALYTICS_DATA} />;
  }

  if (tab === 'customer') {
    return <CustomerAnalyticsCharts data={CUSTOMER_ANALYTICS_DATA} />;
  }

  if (tab === 'hr') {
    return <HrAnalyticsCharts data={HR_ANALYTICS_DATA} />;
  }

  return <OperationsAnalyticsCharts data={OPERATIONS_ANALYTICS_DATA} />;
}
