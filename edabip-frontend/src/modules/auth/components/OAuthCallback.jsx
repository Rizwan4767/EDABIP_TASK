import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import {
  SIGN_IN_FAILED,
  getOAuthErrorMessage,
  postOAuthResultToOpener,
  readOAuthRedirectResult,
  stripOAuthResultFromUrl,
  takeRememberedOAuthProvider,
} from "../services/oauthPopup.js";

/**
 * Landing point for the backend's OAuth redirects — Google and Microsoft both
 * finish here.
 *
 * Must stay a public route: the token is not stored yet when this mounts, so
 * ProtectedRoute would bounce it to /login before it could ever run.
 *
 * Mounts in one of two places. Normally this is the popup, and its only job is
 * to relay the result to the opener and close. When the popup was blocked the
 * handshake ran in the tab instead, and this completes the sign-in itself.
 */
function OAuthCallback() {
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuthContext();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // StrictMode runs mount effects twice on the same instance, and the ref
    // survives that, so the one-shot token is only ever consumed once.
    //
    // Deliberately no `cancelled` cleanup flag here: StrictMode's simulated
    // unmount would set it before the second pass, and the second pass exits
    // on this guard — together they would swallow the navigation entirely.
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const { accessToken, refreshToken, errorCode } = readOAuthRedirectResult();

    // Before the first await, so the tokens never linger in the address bar
    // or in this history entry.
    stripOAuthResultFromUrl();

    // The popup case. Errors travel across too — the opener owns the button
    // that has to show them. Falls through when the opener is already gone,
    // finishing in this window rather than stranding the user.
    if (postOAuthResultToOpener({ accessToken, refreshToken, errorCode })) {
      return;
    }

    const failTo = (message) => {
      navigate("/login", {
        replace: true,
        state: { authError: message || SIGN_IN_FAILED },
      });
    };

    if (errorCode) {
      failTo(getOAuthErrorMessage(errorCode));
      return;
    }

    if (!accessToken || !refreshToken) {
      failTo(SIGN_IN_FAILED);
      return;
    }

    async function finishSignIn() {
      try {
        await completeOAuthLogin({
          accessToken,
          refreshToken,
          // Only reachable via the same-tab fallback, where the button that
          // started the handshake is long gone. The fragment says nothing about
          // which provider issued it, so the button stashed that away first.
          provider: takeRememberedOAuthProvider() || "google",
        });
      } catch (error) {
        failTo(error instanceof Error ? error.message : SIGN_IN_FAILED);
        return;
      }

      // replace: true keeps the callback URL out of the back button.
      navigate("/dashboard", { replace: true });
    }

    finishSignIn();
  }, [completeOAuthLogin, navigate]);

  return (
    <div className="sft-page oauth-callback-page">
      <p role="status" aria-live="polite">
        Signing you in…
      </p>
    </div>
  );
}

export default OAuthCallback;
