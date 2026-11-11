/**
 * Every backend path in one place.
 *
 * The EDABIP FastAPI service mounts its routers at the root — there is no
 * `/api` or `/api/v1` prefix (see `edabip-backend/main.py`).
 */
export const ENDPOINTS = {
  health: '/health',

  auth: {
    register: '/auth/register',
    verifyOtp: '/auth/verify-otp',
    resendOtp: '/auth/resend-otp',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    me: '/auth/me',
    /** Accepts an MSAL id_token and returns tokens as JSON — usable from native. */
    microsoftExchange: '/auth/microsoft/exchange',
    /** Browser-redirect flow; requires an in-app browser session on mobile. */
    googleLogin: '/auth/google/login',
  },

  billing: {
    overview: '/api/billing/overview',
    refresh: '/api/billing/refresh',
    usage: '/api/billing/usage',
    storage: '/api/billing/storage',
    history: '/api/billing/history',
    plans: '/api/billing/plans',
    selectPlan: (planCode: string) => `/api/billing/plans/${encodeURIComponent(planCode)}/select`,
    invoices: '/api/billing/invoices',
    invoiceDownload: (invoiceNumber: string) =>
      `/api/billing/invoices/${encodeURIComponent(invoiceNumber)}/download`,
    paymentMethods: '/api/billing/payment-methods',
    paymentMethodSetupIntent: '/api/billing/payment-methods/setup-intent',
    paymentMethodPrimary: (paymentMethodId: string) =>
      `/api/billing/payment-methods/${encodeURIComponent(paymentMethodId)}/primary`,
    paymentMethod: (paymentMethodId: string) =>
      `/api/billing/payment-methods/${encodeURIComponent(paymentMethodId)}`,
    paymentHistory: '/api/billing/payment-history',
    profile: '/api/billing/profile',
  },
} as const;
