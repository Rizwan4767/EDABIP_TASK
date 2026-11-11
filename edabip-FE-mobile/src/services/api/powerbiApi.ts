import { SALES_ANALYTICS_DATA, type SalesAnalyticsData } from '@/screens/powerbi/powerBiData';
import { normalizeSalesAnalytics } from '@/screens/powerbi/normalizeSalesAnalytics';

/**
 * Power BI report catalog.
 *
 * The web client currently simulates this round-trip because the backend has
 * no reports router. Mobile matches that contract so the list can show its
 * loading state without inventing an endpoint.
 */
export async function getPowerBIReports(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 750));
}

/**
 * Sales analytics charts.
 *
 * FastAPI has no sales-analytics router yet. Web mocks this call; mobile does
 * the same and normalizes the payload so swapping in a real JSON response
 * (USD or thousands) updates the graphs without another chart rewrite.
 */
export async function getSalesAnalyticsData(): Promise<SalesAnalyticsData> {
  await new Promise((resolve) => setTimeout(resolve, 750));
  return normalizeSalesAnalytics(SALES_ANALYTICS_DATA);
}
