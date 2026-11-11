import { CustomerDemandChart } from '@/screens/powerbi/components/CustomerDemandChart';
import { DailySalesTrendChart } from '@/screens/powerbi/components/DailySalesTrendChart';
import { PowerBiDonutCard } from '@/screens/powerbi/components/PowerBiDonutCard';
import type { CustomerAnalyticsData, PowerBiDonutSlice } from '@/screens/powerbi/powerBiData';
import { thousandsUsdTick } from '@/screens/powerbi/salesAnalyticsChart';

const FORECAST_SCALE = { max: 100, ticks: [100, 75, 50, 25, 0] };
const FORECAST_COLOR = '#134B4A';

function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function CustomerAnalyticsCharts({ data }: Readonly<{ data: CustomerAnalyticsData }>) {
  return (
    <>
      <DailySalesTrendChart
        points={data.forecast}
        title="Revenue Forecast"
        yAxisLabel="Revenue (USD)"
        xAxisLabel="Month"
        showPrevious={false}
        showDots
        showLegend={false}
        currentColor={FORECAST_COLOR}
        scale={FORECAST_SCALE}
        formatTick={thousandsUsdTick}
      />
      <PowerBiDonutCard
        title="Customer Segments"
        slices={
          [
            data.segments.find((s) => s.id === 'ent'),
            data.segments.find((s) => s.id === 'smb'),
            data.segments.find((s) => s.id === 'mid'),
          ].filter(isDefined) as PowerBiDonutSlice[]
        }
        legendSlices={
          [
            data.segments.find((s) => s.id === 'ent'),
            data.segments.find((s) => s.id === 'mid'),
            data.segments.find((s) => s.id === 'smb'),
          ].filter(isDefined) as PowerBiDonutSlice[]
        }
        centerValue={`${data.segmentsCenterValue}%`}
        centerLabel="Enterprise"
        layout="split"
        legendVariant="tiles"
        tileBorderColor="#134B4A"
        valueFormat="compact"
        showMenu
      />
      <CustomerDemandChart bars={data.demand} />
    </>
  );
}
