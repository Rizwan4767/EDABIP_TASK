/**
 * Non-secret, environment-independent application constants.
 * Anything that varies per environment belongs in `env.ts` / `.env`.
 */
export const appConfig = {
  appName: 'EDABIP',

  auth: {
    /** The backend issues 4-digit OTPs (`utils/auth.py: generate_otp(length=4)`). */
    otpLength: 4,
    /** Backend OTP validity is 10 minutes for email verification. */
    otpValiditySeconds: 10 * 60,
    /** Client-side cooldown before "resend code" becomes tappable again. */
    otpResendCooldownSeconds: 30,
    /** Backend policy: 5 failed logins triggers a 15 minute lockout. */
    maxLoginAttempts: 5,
    /** Backend password policy is 8–72 characters. */
    minPasswordLength: 8,
    maxPasswordLength: 72,
    /**
     * Refresh the access token this long before its 60 minute expiry so an
     * in-flight request is not the thing that discovers the token is dead.
     */
    accessTokenRefreshLeadSeconds: 5 * 60,
  },

  list: {
    defaultPageSize: 20,
  },

  /**
   * Feature switches for functionality whose backend endpoints do not exist
   * yet. Flip these on as the corresponding API routers ship.
   */
  features: {
    dashboard: false,
    reports: false,
    analytics: false,
    powerBi: false,
    billing: true,
    aiAssistant: false,
    pushNotifications: false,
  },
} as const;

export type AppConfig = typeof appConfig;
