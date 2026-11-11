/**
 * Shared plumbing for the backend's OAuth redirect flows.
 *
 * Google and Microsoft work identically from the SPA's point of view: the
 * browser leaves for `/auth/<provider>/login`, the provider redirects back to
 * the backend, and the backend redirects to `OAUTH_CALLBACK_PATH` with the
 * session tokens in the URL *fragment*. Fragments are never sent to a server,
 * so the tokens stay out of access logs and referrer headers — but it also
 * means they are invisible to `location.search` and `useSearchParams`.
 *
 * That handshake runs in a popup. The backend is unaware of this — it redirects
 * a browser either way — so the popup lands on our own callback route, hands
 * the result back to the opener over `postMessage`, and closes. Falling back to
 * a same-tab redirect keeps the flow working when the popup is blocked.
 */

/** Must match the path both oauth.py and microsoft.py redirect to. */
export const OAUTH_CALLBACK_PATH = "/oauth-callback";

export const SIGN_IN_FAILED =
  "Sign-in could not be completed. Please try again.";

/** Codes the backend appends as `?oauth_error=` when it bounces to /login. */
const OAUTH_ERROR_MESSAGES = {
  google_denied: "Google sign-in was cancelled.",
  microsoft_denied: "Microsoft sign-in was cancelled.",
};

export function getApiBaseUrl() {
  return String(
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
  ).replace(/\/$/, "");
}

export function getOAuthErrorMessage(code) {
  if (!code) {
    return "";
  }

  return OAUTH_ERROR_MESSAGES[code] || SIGN_IN_FAILED;
}

/**
 * Reads the redirect result. Tokens only ever arrive in the fragment; error
 * codes are read from both places so a backend change of heart still surfaces.
 */
export function readOAuthRedirectResult() {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null, errorCode: null };
  }

  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);

  return {
    accessToken: fragment.get("access_token"),
    refreshToken: fragment.get("refresh_token"),
    errorCode:
      fragment.get("error") ||
      query.get("error") ||
      query.get("oauth_error") ||
      null,
  };
}

/**
 * Drops the tokens from the address bar and from this history entry, so they
 * are not recoverable with the back button or a shared URL.
 */
export function stripOAuthResultFromUrl() {
  if (typeof window === "undefined") {
    return;
  }

  window.history.replaceState(null, "", window.location.pathname);
}

/** Identifies our own popup handshake among every other `message` on the page. */
export const OAUTH_POPUP_MESSAGE = "edabip:oauth-result";

const POPUP_WIDTH = 500;
const POPUP_HEIGHT = 640;

/**
 * Opens the popup that will carry the handshake.
 *
 * Must be called *synchronously* from the click handler — after the first
 * `await` the browser no longer credits the call to a user gesture and blocks
 * it. So this opens a blank window that the caller points at the provider once
 * its async pre-work has settled.
 *
 * The name is per-provider: a shared one makes `window.open` hand back the
 * window the *other* provider is already using, silently hijacking its flow.
 *
 * Returns null when the popup was blocked; the caller is expected to fall back
 * to a same-tab redirect.
 */
export function openOAuthPopup(provider) {
  if (typeof window === "undefined") {
    return null;
  }

  // Centre on the window the user is actually looking at, which on a
  // multi-monitor setup is not necessarily the primary screen.
  const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
  const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;

  const features = [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${Math.max(0, Math.round(left))}`,
    `top=${Math.max(0, Math.round(top))}`,
    "resizable=yes",
    "scrollbars=yes",
    // Deliberately no `noopener` — it would null out `window.opener` and the
    // popup would have no way to hand the tokens back.
  ].join(",");

  return window.open("", `edabip-sso-${provider}`, features) || null;
}

/** True when this document is the popup half of the handshake. */
export function isOAuthPopup() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return Boolean(window.opener) && window.opener !== window;
  } catch {
    // A cross-origin opener throws on access; either way it is not ours.
    return false;
  }
}

/**
 * Hands the redirect result back to the opener and closes the popup.
 *
 * Returns false when there is no usable opener left — the caller then finishes
 * the sign-in in this window instead, so a user who closed the original tab is
 * not stranded. `targetOrigin` is pinned to our own origin: the popup lands
 * back on the SPA, so anything else means the handshake went astray.
 */
export function postOAuthResultToOpener(result) {
  if (!isOAuthPopup()) {
    return false;
  }

  try {
    window.opener.postMessage(
      { type: OAUTH_POPUP_MESSAGE, ...result },
      window.location.origin
    );
  } catch {
    return false;
  }

  window.close();
  return true;
}

/**
 * Which provider started the handshake.
 *
 * Only the same-tab fallback needs this. The tokens come back in an anonymous
 * fragment, so a callback running in the tab has no way to tell Google from
 * Microsoft — but the button that sent the browser away does. In the popup case
 * that button is still alive and passes the provider directly.
 */
const PROVIDER_STORAGE_KEY = "edabip:oauth-provider";

export function rememberOAuthProvider(provider) {
  try {
    window.sessionStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    // Private mode or a full quota; the callback falls back to a default.
  }
}

/** Reads and clears it, so a later visit cannot inherit a stale provider. */
export function takeRememberedOAuthProvider() {
  try {
    const provider = window.sessionStorage.getItem(PROVIDER_STORAGE_KEY);
    window.sessionStorage.removeItem(PROVIDER_STORAGE_KEY);
    return provider || null;
  } catch {
    return null;
  }
}
