import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';

import { ChartFilterIcon } from '@/assets/powerbi';
import { AppText } from '@/components/common/AppText';
import { BottomSheet } from '@/components/modals/BottomSheet';
import { DashboardIcon } from '@/screens/dashboard/components/DashboardIcon';
import { DailySalesTrendChart } from '@/screens/powerbi/components/DailySalesTrendChart';
import { PowerBiDonutCard } from '@/screens/powerbi/components/PowerBiDonutCard';
import { dailySalesTrendChartStyles as styles } from '@/screens/powerbi/components/dailySalesTrendChartStyles';
import type { FinancialAnalyticsData } from '@/screens/powerbi/powerBiData';
import { thousandsUsdTick } from '@/screens/powerbi/salesAnalyticsChart';

const YTD_SCALE = { max: 100, ticks: [100, 75, 50, 25, 0] };
const REVENUE_COLOR = '#134B4A';
const EXPENSE_COLOR = '#84D8D4';

const PERIODS = [
  { id: 'ytd', label: 'Year to date' },
  { id: '6m', label: 'Last 6 months' },
  { id: '3m', label: 'Last 3 months' },
] as const;

type PeriodId = (typeof PERIODS)[number]['id'];

function monthCount(id: PeriodId): number {
  if (id === '6m') return 6;
  if (id === '3m') return 3;
  return 0;
}

export function FinancialAnalyticsCharts({ data }: Readonly<{ data: FinancialAnalyticsData }>) {
  const [periodId, setPeriodId] = useState<PeriodId>('ytd');
  const [filterOpen, setFilterOpen] = useState(false);
  const points = useMemo(() => {
    const count = monthCount(periodId);
    if (!count) {
      return data.revenueVsExpenses;
    }
    return data.revenueVsExpenses.slice(-count);
  }, [data.revenueVsExpenses, periodId]);

  return (
    <>
      <DailySalesTrendChart
        points={points}
        title="Revenue vs Expenses (YTD)"
        yAxisLabel="Revenue (USD)"
        currentLabel="Revenue"
        previousLabel="Expenses"
        showDots
        hideXAxisTitle
        currentColor={REVENUE_COLOR}
        previousColor={EXPENSE_COLOR}
        scale={YTD_SCALE}
        formatTick={thousandsUsdTick}
        headerRight={
          <Pressable
            onPress={() => setFilterOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter revenue versus expenses"
            style={styles.filterBtn}
          >
            <DashboardIcon icon={ChartFilterIcon} size={14} />
            <AppText variant="label" style={styles.filterLabel}>
              Filter
            </AppText>
          </Pressable>
        }
      />
      <PowerBiDonutCard
        title="Reports by Status"
        slices={data.expenseSlices}
        centerValue="240"
        centerLabel="Total Expense"
        layout="split"
        legendVariant="tiles"
        valueFormat="compact"
        showMenu
      />
      <BottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="Filter period">
        {PERIODS.map((option) => (
          <Pressable
            key={option.id}
            onPress={() => {
              setPeriodId(option.id);
              setFilterOpen(false);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: periodId === option.id }}
            style={styles.filterOption}
          >
            <AppText
              variant={periodId === option.id ? 'bodyStrong' : 'body'}
              color={periodId === option.id ? 'brand' : 'text'}
            >
              {option.label}
            </AppText>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
