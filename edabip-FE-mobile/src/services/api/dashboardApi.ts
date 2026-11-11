import { notImplemented } from '@/services/api/notImplemented';

/**
 * Dashboard KPIs and summary widgets.
 *
 * Blocked on the backend: `edabip-backend` exposes no dashboard router today,
 * so no request or response shape is defined here. Wire the real paths into
 * `ENDPOINTS` and flip `appConfig.features.dashboard` when the API lands.
 */
export const dashboardApi = {
  getSummary: () => notImplemented('dashboardApi.getSummary'),
  getKpis: () => notImplemented('dashboardApi.getKpis'),
};
