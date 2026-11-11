/**
 * Every persisted key in one place, so nothing is stored under an ad-hoc
 * string and "clear everything on logout" stays auditable.
 */
export const SECURE_KEYS = {
  accessToken: 'edabip.auth.accessToken',
  refreshToken: 'edabip.auth.refreshToken',
  accessTokenExpiresAt: 'edabip.auth.accessTokenExpiresAt',
} as const;

export const PREFERENCE_KEYS = {
  colorScheme: 'edabip.pref.colorScheme',
  onboardingCompleted: 'edabip.pref.onboardingCompleted',
  lastSignedInEmail: 'edabip.pref.lastSignedInEmail',
  locale: 'edabip.pref.locale',
  /** Local profile photos keyed by email. There is no upload API yet. */
  profilePictures: 'edabip.pref.profilePictures',
  /** Settings page values keyed by email until a settings API exists. */
  settingsByEmail: 'edabip.pref.settingsByEmail',
  /**
   * Incomplete-profile prompt dismissals keyed by user id → access token.
   * A new login mints a new token, so the sheet can appear again next session.
   */
  profilePromptDismissed: 'edabip.pref.profilePromptDismissed',
} as const;
