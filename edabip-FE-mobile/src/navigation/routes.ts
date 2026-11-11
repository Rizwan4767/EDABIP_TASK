/**
 * Canonical route paths.
 *
 * Navigation is file-based (Expo Router) — `app/` owns the route tree and there
 * is no second navigator definition. These constants exist so screens call
 * `router.push(ROUTES.login)` instead of scattering string literals, which
 * keeps renames to a single edit.
 */
export const ROUTES = {
  auth: {
    landing: '/landing',
    login: '/login',
    signup: '/signup',
    otp: '/otp',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    passwordResetSuccess: '/password-reset-success',
    accountLocked: '/account-locked',
  },
  main: {
    dashboard: '/dashboard',
    analytics: '/analytics',
    reports: '/reports',
    ai: '/ai',
    more: '/more',
    powerBi: '/powerbi',
    tableau: '/tableau',
    billing: '/billing',
    users: '/users',
    settings: '/settings',
    profile: '/profile',
    updateProfile: '/update-profile',
    paymentHistory: '/payment-history',
  },
} as const;

/** Nested Power BI analytics page opened from a report card, e.g. `/powerbi/sales`. */
export function powerBiReportHref(reportId: string) {
  return `${ROUTES.main.powerBi}/${reportId}` as const;
}

/** Query value that scrolls Billing to "Choose the Right Plan for Your Business". */
export const BILLING_PLANS_SECTION = 'plans';

export function billingPlansHref(focus = Date.now()) {
  return {
    pathname: ROUTES.main.billing,
    params: {
      section: BILLING_PLANS_SECTION,
      focus: String(focus),
    },
  } as const;
}

/** Landing route after a successful sign-in. */
export const HOME_ROUTE = ROUTES.main.dashboard;
