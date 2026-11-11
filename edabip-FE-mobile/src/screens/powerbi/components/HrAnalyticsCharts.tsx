import { DailySalesTrendChart } from '@/screens/powerbi/components/DailySalesTrendChart';
import { DiversityByDepartmentChart } from '@/screens/powerbi/components/DiversityByDepartmentChart';
import type { HrAnalyticsData } from '@/screens/powerbi/powerBiData';
import { salesUsdTick } from '@/screens/powerbi/salesAnalyticsChart';

const ENGAGEMENT_SCALE = { max: 100000, ticks: [100000, 75000, 50000, 25000, 0] };
const ENGAGEMENT_COLOR = '#134B4A';

export function HrAnalyticsCharts({ data }: Readonly<{ data: HrAnalyticsData }>) {
  return (
    <>
      <DailySalesTrendChart
        points={data.engagement}
        title="Engagement Score Trend"
        yAxisLabel="Revenue (USD)"
        xAxisLabel="Month"
        showPrevious={false}
        showDots
        showLegend={false}
        showMenu
        currentColor={ENGAGEMENT_COLOR}
        scale={ENGAGEMENT_SCALE}
        formatTick={salesUsdTick}
      />
      <DiversityByDepartmentChart bars={data.diversity} />
    </>
  );
}
