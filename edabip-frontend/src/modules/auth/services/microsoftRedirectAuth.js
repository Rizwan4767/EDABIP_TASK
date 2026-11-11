/**
 * Microsoft sign-in via the backend's redirect flow.
 *
 * microsoft.py also exposes POST /auth/microsoft/exchange for an MSAL-issued
 * idToken. This uses the redirect endpoints instead: they land on the same
 * /oauth-callback as Google, so the whole popup handshake is already built, and
 * the client secret stays on the server where it belongs. Choosing MSAL would
 * mean a new browser dependency and a second auth mechanism to maintain.
 *
 * Requires MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in the backend .env.
 * Until those are set, /auth/microsoft/login answers 503 and the button surfaces
 * the failure message below.
 */

import { getApiBaseUrl } from "./oauthPopup.js";

const MICROSOFT_LOGIN_PATH = "/auth/microsoft/login";

export const MICROSOFT_SIGN_IN_FAILED =
  "Microsoft sign-in could not be completed. Please try again.";

export function getMicrosoftLoginUrl() {
  return `${getApiBaseUrl()}${MICROSOFT_LOGIN_PATH}`;
}
