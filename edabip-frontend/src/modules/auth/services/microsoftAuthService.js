/**
 * Microsoft authentication adapter.
 *
 * Production flow (when @azure/msal-browser is installed and configured):
 *   popup/redirect → Microsoft identity result → backend token exchange → EDABIP session
 *
 * Real Microsoft MFA is handled inside Microsoft's hosted UI.
 * Mock auth uses MicrosoftMockSignInFlow to mimic sign-in + approve-request MFA locally.
 * EDABIP may also show its own MFA modal when the backend returns APP_STEP_UP_REQUIRED.
 *
 * Required packages (NOT installed yet — document in release notes before adding):
 *   @azure/msal-browser
 *   @azure/msal-react  (optional React helpers)
 *
 * After installing MSAL, replace loginWithMicrosoftProduction() with a real
 * PublicClientApplication popup/redirect flow, then POST the idToken to the
 * EDABIP backend exchange endpoint. Never treat the Microsoft access token as
 * an EDABIP session, and never store Microsoft tokens in plain localStorage.
 */

import { getMicrosoftAuthConfig, LOGIN_RESULT_STATUS } from "../utils/authConfig.js";
import {
  AUTH_ERROR_CODES,
  createAuthError,
} from "../utils/authErrors.js";
import { isMockAuthEnabled } from "../utils/mockSession.js";

export const MOCK_MICROSOFT_USER = {
  id: "mock-microsoft-user",
  name: "Microsoft Demo User",
  fullName: "Microsoft Demo User",
  email: "microsoft.user@edabip.test",
  provider: "microsoft",
  roles: ["user"],
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock-only Microsoft identity. UI steps live in MicrosoftMockSignInFlow.
 */
async function loginWithMicrosoftMock() {
  await delay(400);

  return {
    status: LOGIN_RESULT_STATUS.AUTHENTICATED,
    isMock: true,
    // Placeholder for what a real Microsoft result would look like before backend exchange.
    microsoftResult: {
      account: {
        homeAccountId: MOCK_MICROSOFT_USER.id,
        username: MOCK_MICROSOFT_USER.email,
        name: MOCK_MICROSOFT_USER.name,
      },
    },
    user: { ...MOCK_MICROSOFT_USER },
  };
}

/**
 * Production path scaffold.
 * MSAL is intentionally not imported until the packages are installed,
 * so this SPA continues to build without @azure/msal-browser.
 */
async function loginWithMicrosoftProduction() {
  const config = getMicrosoftAuthConfig();

  if (!config.isConfigured) {
    throw createAuthError(AUTH_ERROR_CODES.MICROSOFT_UNAVAILABLE);
  }

  // Configuration exists, but MSAL + backend exchange are not wired yet.
  // Intended next steps after installing @azure/msal-browser / @azure/msal-react:
  //
  // const { PublicClientApplication } = await import("@azure/msal-browser");
  // const pca = new PublicClientApplication({
  //   auth: {
  //     clientId: config.clientId,
  //     authority: config.authority,
  //     redirectUri: config.redirectUri,
  //   },
  //   cache: {
  //     cacheLocation: "sessionStorage",
  //     storeAuthStateInCookie: false,
  //   },
  // });
  // await pca.initialize();
  // const loginResponse = await pca.loginPopup({
  //   scopes: ["openid", "profile", "email", "User.Read"],
  //   prompt: "select_account",
  // });
  // const exchange = await apiClient.post("/auth/microsoft/exchange", {
  //   idToken: loginResponse.idToken,
  // });
  // return mapBackendMicrosoftResponse(exchange.data);

  throw createAuthError(AUTH_ERROR_CODES.MICROSOFT_UNAVAILABLE);
}

/**
 * Entry point used by the Microsoft SSO button.
 */
export async function loginWithMicrosoft() {
  if (isMockAuthEnabled) {
    return loginWithMicrosoftMock();
  }

  return loginWithMicrosoftProduction();
}

export function getMicrosoftUnavailableMessage() {
  return createAuthError(AUTH_ERROR_CODES.MICROSOFT_UNAVAILABLE).message;
}
