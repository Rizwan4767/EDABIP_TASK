import { DailySalesTrendChart } from '@/screens/powerbi/components/DailySalesTrendChart';
import { PowerBiDonutCard } from '@/screens/powerbi/components/PowerBiDonutCard';
import { PowerBiHealthList } from '@/screens/powerbi/components/PowerBiHealthList';
import { ServerLoadByRegionChart } from '@/screens/powerbi/components/ServerLoadByRegionChart';
import type { OperationsAnalyticsData, PowerBiDonutSlice } from '@/screens/powerbi/powerBiData';

const PERFORMANCE_SCALE = { max: 250, ticks: [250, 200, 150, 100, 0] };
const RESPONSE_TIME_COLOR = '#134B4A';
const CPU_LOAD_COLOR = '#84D8D4';

function isDefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

function formatPlainTick(value: number): string {
  return value === 0 ? '0' : String(value);
}

export function OperationsAnalyticsCharts({ data }: Readonly<{ data: OperationsAnalyticsData }>) {
  return (
    <>
      <PowerBiHealthList title="Application Health Monitor" rows={data.health} />
      <DailySalesTrendChart
        points={data.performance}
        title="System performance (24h)"
        yAxisLabel="Revenue (USD)"
        currentLabel="Response Time"
        previousLabel="CPU Load"
        showDots
        showPreviousDots={false}
        showMenu
        hideXAxisTitle
        scale={PERFORMANCE_SCALE}
        formatTick={formatPlainTick}
        currentColor={RESPONSE_TIME_COLOR}
        previousColor={CPU_LOAD_COLOR}
      />
      <ServerLoadByRegionChart bars={data.serverLoad} />
      <PowerBiDonutCard
        title="Incident Breakdown"
        slices={
          [
            data.incidents.find((s) => s.id === 'infra'),
            data.incidents.find((s) => s.id === 'network'),
            data.incidents.find((s) => s.id === 'security'),
          ].filter(isDefined) as PowerBiDonutSlice[]
        }
        legendSlices={
          [
            data.incidents.find((s) => s.id === 'infra'),
            data.incidents.find((s) => s.id === 'network'),
            data.incidents.find((s) => s.id === 'security'),
          ].filter(isDefined) as PowerBiDonutSlice[]
        }
        centerValue="240"
        centerLabel="Total Incident"
        layout="split"
        legendVariant="tiles"
        valueFormat="spaced"
        showMenu
      />
    </>
  );
}
