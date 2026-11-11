import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import {
  OAUTH_POPUP_MESSAGE,
  getOAuthErrorMessage,
  openOAuthPopup,
  rememberOAuthProvider,
} from "../services/oauthPopup.js";

/**
 * Runs one of the backend's OAuth handshakes in a popup.
 *
 * The login endpoint answers with a 302 to the provider's consent screen, which
 * a browser must follow itself — an XHR would follow it in the background and
 * fail on the provider's CORS policy. So the popup navigates the real thing,
 * lands back on our own /oauth-callback, and posts the tokens here. The login
 * page never unloads, which is the whole point of the popup.
 *
 * If the popup is blocked this navigates the current tab instead, and
 * /oauth-callback completes the sign-in on its own.
 */

/**
 * How long to keep waiting for a queued `message` after the popup reports
 * closed. The popup posts and *then* closes, so the two race; without this
 * grace period a successful sign-in gets mistaken for a cancelled one.
 */
const POPUP_CLOSE_GRACE_MS = 400;
const POPUP_POLL_MS = 300;

export function useOAuthPopupSignIn({ provider, getLoginUrl, failureMessage }) {
  const navigate = useNavigate();
  const { clearPendingAuthentication, completeOAuthLogin } = useAuthContext();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isPendingRef = useRef(false);
  const popupRef = useRef(null);
  const pollRef = useRef(null);
  const graceRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (graceRef.current) {
      window.clearTimeout(graceRef.current);
      graceRef.current = null;
    }
  }, []);

  const endFlow = useCallback(() => {
    clearTimers();
    isPendingRef.current = false;
    popupRef.current = null;
    setIsSigningIn(false);
  }, [clearTimers]);

  // Registered once rather than per attempt: a listener added inside the click
  // handler would race the popup, which can post before the handler resumes.
  useEffect(() => {
    const handleMessage = async (event) => {
      // The popup lands back on our own origin, so anything else is not ours
      // and must never be trusted with a session.
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data?.type !== OAUTH_POPUP_MESSAGE) {
        return;
      }
      // A late duplicate, or the other provider's button on the same page.
      if (!isPendingRef.current) {
        return;
      }
      // Both providers listen on this window, so pin the result to the popup
      // this hook actually opened rather than trusting the pending flag alone.
      if (popupRef.current && event.source !== popupRef.current) {
        return;
      }

      endFlow();

      const { accessToken, refreshToken, errorCode } = event.data;

      if (errorCode) {
        setErrorMessage(getOAuthErrorMessage(errorCode));
        return;
      }
      if (!accessToken || !refreshToken) {
        setErrorMessage(failureMessage);
        return;
      }

      try {
        await completeOAuthLogin({ accessToken, refreshToken, provider });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : failureMessage
        );
        return;
      }

      navigate("/dashboard", { replace: true });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [completeOAuthLogin, endFlow, failureMessage, navigate, provider]);

  // Leaving the login page mid-handshake must not leak a timer or an orphaned
  // window the user can no longer act on.
  useEffect(() => {
    return () => {
      clearTimers();
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, [clearTimers]);

  const watchForManualClose = useCallback(() => {
    pollRef.current = window.setInterval(() => {
      if (!popupRef.current?.closed) {
        return;
      }

      window.clearInterval(pollRef.current);
      pollRef.current = null;

      // Do not conclude "cancelled" yet — a result may still be in flight.
      graceRef.current = window.setTimeout(() => {
        if (isPendingRef.current) {
          endFlow();
        }
      }, POPUP_CLOSE_GRACE_MS);
    }, POPUP_POLL_MS);
  }, [endFlow]);

  const startSignIn = useCallback(async () => {
    if (isPendingRef.current) {
      return;
    }

    isPendingRef.current = true;
    setErrorMessage("");
    setIsSigningIn(true);

    // Synchronously, while the click still counts as a user gesture. Anything
    // opened after the await below would be swallowed by the popup blocker.
    const popup = openOAuthPopup(provider);

    try {
      // Switching providers must clear any incomplete email MFA challenge.
      await clearPendingAuthentication?.();
    } catch {
      // Best-effort; a stale challenge must not block SSO.
    }

    const loginUrl = getLoginUrl();

    // Blocked, or dismissed during the await — fall back to the same-tab
    // redirect, which needs no popup permission to work. The callback runs
    // without this component alive, so the provider has to outlive it.
    if (!popup || popup.closed) {
      rememberOAuthProvider(provider);
      try {
        window.location.href = loginUrl;
      } catch {
        endFlow();
        setErrorMessage(failureMessage);
      }
      return;
    }

    popupRef.current = popup;

    try {
      popup.location.href = loginUrl;
    } catch {
      popup.close();
      endFlow();
      setErrorMessage(failureMessage);
      return;
    }

    popup.focus?.();
    watchForManualClose();
  }, [
    clearPendingAuthentication,
    endFlow,
    failureMessage,
    getLoginUrl,
    provider,
    watchForManualClose,
  ]);

  return { startSignIn, isSigningIn, errorMessage, setErrorMessage };
}

export default useOAuthPopupSignIn;
