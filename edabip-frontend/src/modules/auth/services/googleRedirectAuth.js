/**
 * Google sign-in via the backend's redirect flow.
 *
 * Only the provider-specific bits live here. The popup handshake, the callback
 * parsing and the shared error copy are in oauthPopup.js, which Microsoft uses
 * the same way.
 */

import { getApiBaseUrl } from "./oauthPopup.js";

const GOOGLE_LOGIN_PATH = "/auth/google/login";

export const GOOGLE_SIGN_IN_FAILED =
  "Google sign-in could not be completed. Please try again.";

export function getGoogleLoginUrl() {
  return `${getApiBaseUrl()}${GOOGLE_LOGIN_PATH}`;
}
