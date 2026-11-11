/**
 * Central auth configuration. Keep provider IDs and redirect URIs in env vars.
 * Never place Microsoft client secrets in the SPA.
 */

export const AUTH_STATUS = {
  UNAUTHENTICATED: "unauthenticated",
  MFA_PENDING: "mfa_pending",
  AUTHENTICATED: "authenticated",
};

export const LOGIN_RESULT_STATUS = {
  AUTHENTICATED: "AUTHENTICATED",
  MFA_REQUIRED: "MFA_REQUIRED",
  APP_STEP_UP_REQUIRED: "APP_STEP_UP_REQUIRED",
  REJECTED: "REJECTED",
};

export const MFA_METHOD = {
  EMAIL_OTP: "EMAIL_OTP",
};

export function getMicrosoftAuthConfig() {
  const clientId = String(import.meta.env.VITE_MICROSOFT_CLIENT_ID || "").trim();
  const tenantId =
    String(import.meta.env.VITE_MICROSOFT_TENANT_ID || "").trim() || "common";
  const redirectUri =
    String(import.meta.env.VITE_MICROSOFT_REDIRECT_URI || "").trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  return {
    clientId,
    tenantId,
    redirectUri,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    isConfigured: Boolean(clientId),
  };
}
