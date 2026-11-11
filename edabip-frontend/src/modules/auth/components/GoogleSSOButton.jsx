import { useCallback, useId } from "react";
import GoogleIcon from "../../../assets/Authv2/Google.svg";
import useOAuthPopupSignIn from "../hooks/useOAuthPopupSignIn.js";
import {
  GOOGLE_SIGN_IN_FAILED,
  getGoogleLoginUrl,
} from "../services/googleRedirectAuth.js";

/** Continue with Google — the backend's redirect flow, run in a popup. */
function GoogleSSOButton({ className }) {
  const errorId = useId();
  const getLoginUrl = useCallback(() => getGoogleLoginUrl(), []);

  const { startSignIn, isSigningIn, errorMessage } = useOAuthPopupSignIn({
    provider: "google",
    getLoginUrl,
    failureMessage: GOOGLE_SIGN_IN_FAILED,
  });

  const buttonClassName = className || "sso-btn google-btn";

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={startSignIn}
        disabled={isSigningIn}
        aria-busy={isSigningIn}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-label={
          isSigningIn ? "Signing in with Google" : "Continue with Google"
        }
      >
        <img src={GoogleIcon} alt="" />
      </button>

      {errorMessage ? (
        <p id={errorId} className="sso-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}

export default GoogleSSOButton;
