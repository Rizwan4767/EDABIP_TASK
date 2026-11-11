import { notImplemented } from '@/services/api/notImplemented';

/**
 * Reports listing, detail, and export.
 *
 * Blocked on the backend — see `dashboardApi.ts` for the rationale.
 * Gated by `appConfig.features.reports`.
 */
export const reportsApi = {
  list: () => notImplemented('reportsApi.list'),
  getById: () => notImplemented('reportsApi.getById'),
  requestExport: () => notImplemented('reportsApi.requestExport'),
};
