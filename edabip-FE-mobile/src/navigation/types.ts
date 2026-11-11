/**
 * Route parameter contracts.
 *
 * Expo Router generates its own `href` types into `.expo/types` (enabled via
 * `experiments.typedRoutes`). These interfaces cover the search params a screen
 * reads with `useLocalSearchParams`, which the generated types do not describe.
 */

/** `signup` verifies a new account after registration. */
export type OtpFlow = 'signup' | 'login';

/** `/otp?email=…&flow=…`. Values arrive as strings and are narrowed in the screen. */
export interface OtpScreenParams {
  email?: string;
  flow?: string;
}

/** `/reset-password?token=…` — the token arrives via the emailed deep link. */
export interface ResetPasswordScreenParams {
  token?: string;
}

/**
 * `/account-locked?email=…&message=…` — set when Login redirects here after
 * a 423 (`utils/security.py: is_account_locked`) response. `message` is the
 * backend's own lockout copy (e.g. "...Try again in 5 minute(s).") and takes
 * priority over the screen's default Figma copy when present.
 */
export interface AccountLockedScreenParams {
  email?: string;
  message?: string;
}

/**
 * `/billing?section=plans&focus=…` — `focus` is a nonce so tapping
 * "Upgrade Your Plan" while already on billing still re-scrolls to the
 * plan selector.
 */
export interface BillingScreenParams {
  section?: string;
  focus?: string;
}
