import { KpiCustomersIcon, KpiGrowthIcon, KpiProfitIcon, KpiRevenueIcon } from '@/assets/powerbi';
import {
  SALES_ANALYTICS_DATA,
  type DailySalesPoint,
  type MonthlyRevenueBar,
  type SalesAnalyticsData,
  type SalesKpi,
  type SalesKpiTone,
  type SalesRegion,
  type SalesRep,
} from '@/screens/powerbi/powerBiData';
import { usdFromMaybeThousands } from '@/screens/powerbi/salesAnalyticsChart';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function toneFromTrend(value: unknown): SalesKpiTone {
  if (value === 'down') return 'down';
  if (value === 'up') return 'up';
  return 'info';
}

function parseAmount(label: string, amount: unknown): number {
  if (typeof amount === 'number' && Number.isFinite(amount)) {
    return amount;
  }
  const parsed = Number.parseFloat(label.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function dayLabel(point: Record<string, unknown>, index: number, count: number): string {
  const labeled = asString(point.day);
  if (labeled) return labeled;
  if (count >= 12) return `Day ${Math.floor(index / 2) + 1}`;
  return `Day ${index + 1}`;
}

function normalizeDaily(raw: unknown): DailySalesPoint[] {
  if (!Array.isArray(raw)) {
    return SALES_ANALYTICS_DATA.dailyTrend;
  }

  const rows = raw.filter(isRecord);
  const toUsd = usdFromMaybeThousands(
    rows.flatMap((row) => [asNumber(row.current), asNumber(row.previous)]),
  );

  return rows.map((row, index) => ({
    day: dayLabel(row, index, rows.length),
    current: toUsd(asNumber(row.current)),
    previous: toUsd(asNumber(row.previous)),
  }));
}

function normalizeMonthly(raw: unknown): MonthlyRevenueBar[] {
  if (!Array.isArray(raw)) {
    return SALES_ANALYTICS_DATA.monthlyRevenue;
  }

  const rows = raw.filter(isRecord);
  const toUsd = usdFromMaybeThousands(
    rows.flatMap((row) => [asNumber(row.value), asNumber(row.total)]),
  );

  return rows.map((row) => ({
    month: asString(row.month, '—'),
    value: toUsd(asNumber(row.value)),
    total: toUsd(asNumber(row.total)),
  }));
}

function kpiFromStat(
  id: string,
  title: string,
  icon: SalesKpi['icon'],
  stat: unknown,
  fallback: SalesKpi,
): SalesKpi {
  if (!isRecord(stat)) return fallback;
  return {
    id,
    title,
    value: asString(stat.value, fallback.value),
    change: asString(stat.changeLabel, asString(stat.change, fallback.change)),
    tone: toneFromTrend(stat.trend ?? stat.tone),
    icon,
  };
}

function normalizeKpis(raw: unknown, stats: unknown): SalesKpi[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.filter(isRecord).map((row, index) => {
      const fallback = SALES_ANALYTICS_DATA.kpis[index] ?? SALES_ANALYTICS_DATA.kpis[0];
      return {
        id: asString(row.id, fallback?.id ?? `kpi-${index}`),
        title: asString(row.title, fallback?.title ?? 'Metric'),
        value: asString(row.value, fallback?.value ?? '—'),
        change: asString(row.change, fallback?.change ?? ''),
        tone: toneFromTrend(row.tone),
        icon: fallback?.icon ?? KpiRevenueIcon,
      };
    });
  }

  if (!isRecord(stats)) {
    return SALES_ANALYTICS_DATA.kpis;
  }

  const [revenue, growth, customers, profit] = SALES_ANALYTICS_DATA.kpis;
  if (!revenue || !growth || !customers || !profit) {
    return SALES_ANALYTICS_DATA.kpis;
  }

  return [
    kpiFromStat('revenue', 'Total Revenue', KpiRevenueIcon, stats.totalRevenue, revenue),
    kpiFromStat('growth', 'Sales Growth', KpiGrowthIcon, stats.salesGrowth, growth),
    kpiFromStat(
      'customers',
      'Active Customers',
      KpiCustomersIcon,
      stats.activeCustomers,
      customers,
    ),
    kpiFromStat('profit', 'Profit Margin', KpiProfitIcon, stats.profitMargin, profit),
  ];
}

function normalizeRegions(raw: unknown): SalesRegion[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return SALES_ANALYTICS_DATA.regions;
  }

  return raw.filter(isRecord).map((row, index) => {
    const fallback = SALES_ANALYTICS_DATA.regions[index];
    const name = asString(row.name, fallback?.name ?? 'Region');
    const value = asString(row.value, fallback?.value ?? '0');
    return {
      name,
      value,
      amount: parseAmount(value, row.amount),
      x: asNumber(row.x, fallback?.x ?? 50),
      y: asNumber(row.y, fallback?.y ?? 50),
    };
  });
}

function normalizeReps(raw: unknown): SalesRep[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return SALES_ANALYTICS_DATA.topReps;
  }

  return raw.filter(isRecord).map((row, index) => ({
    id: asString(row.id, `rep-${index}`),
    name: asString(row.name, 'Rep'),
    revenue: asString(row.revenue, '$0'),
  }));
}

/**
 * Accepts the mobile mock shape or the web `stats` payload and returns USD
 * series the charts can plot. Values under 500 are treated as thousands.
 */
export function normalizeSalesAnalytics(raw: unknown): SalesAnalyticsData {
  const payload = isRecord(raw) ? raw : {};
  return {
    kpis: normalizeKpis(payload.kpis, payload.stats),
    dailyTrend: normalizeDaily(payload.dailyTrend),
    monthlyRevenue: normalizeMonthly(payload.monthlyRevenue),
    regions: normalizeRegions(payload.regions),
    topReps: normalizeReps(payload.topReps),
  };
}
