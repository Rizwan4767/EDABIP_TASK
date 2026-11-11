import { notImplemented } from '@/services/api/notImplemented';

/**
 * Analytics series and predictive forecasts.
 *
 * Blocked on the backend — see `dashboardApi.ts` for the rationale.
 * Gated by `appConfig.features.analytics`.
 */
export const analyticsApi = {
  getSeries: () => notImplemented('analyticsApi.getSeries'),
  getForecast: () => notImplemented('analyticsApi.getForecast'),
};
