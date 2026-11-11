import { lazy, Suspense, useCallback, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { LOGIN_RESULT_STATUS } from "../utils/authConfig.js";
import {
  AUTH_ERROR_CODES,
  getSafeAuthErrorMessage,
} from "../utils/authErrors.js";
import useOAuthPopupSignIn from "../hooks/useOAuthPopupSignIn.js";
import { loginWithMicrosoft } from "../services/microsoftAuthService.js";
import {
  MICROSOFT_SIGN_IN_FAILED,
  getMicrosoftLoginUrl,
} from "../services/microsoftRedirectAuth.js";
import { isMockAuthEnabled } from "../utils/mockSession.js";
import MicrosoftMockSignInFlow from "./MicrosoftMockSignInFlow.jsx";
import "./MicrosoftSSOButton.css";

const MfaVerificationSuccess = lazy(() => import("./MfaVerificationSuccess"));

function MicrosoftIcon() {
  return (
    <svg
      className="btn-icon"
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="8" height="8" stroke="#134B4A" strokeWidth="1" />
      <rect x="11" y="1" width="8" height="8" stroke="#134B4A" strokeWidth="1" />
      <rect x="1" y="11" width="8" height="8" stroke="#134B4A" strokeWidth="1" />
      <rect x="11" y="11" width="8" height="8" stroke="#134B4A" strokeWidth="1" />
    </svg>
  );
}

/**
 * Continue with Microsoft.
 *
 * Production: the backend's redirect flow, run in a popup, so Microsoft MFA
 * stays inside Microsoft's hosted UI. Lands on the same /oauth-callback as
 * Google — see microsoftRedirectAuth.js for why this and not MSAL.
 *
 * Mock auth: local multi-step Microsoft lookalike → EDABIP success → dashboard.
 */
function MicrosoftSSOButton({ className }) {
  const navigate = useNavigate();
  const { loginWithMicrosoftIdentity, clearPendingAuthentication } =
    useAuthContext();
  const [showMockFlow, setShowMockFlow] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMockProcessing, setIsMockProcessing] = useState(false);
  const mockProcessingRef = useRef(false);
  const triggerRef = useRef(null);
  const errorId = useId();

  const getLoginUrl = useCallback(() => getMicrosoftLoginUrl(), []);

  const { startSignIn, isSigningIn, errorMessage, setErrorMessage } =
    useOAuthPopupSignIn({
      provider: "microsoft",
      getLoginUrl,
      failureMessage: MICROSOFT_SIGN_IN_FAILED,
    });

  const isBusy = isSigningIn || isMockProcessing;

  const finishMockProcessing = () => {
    mockProcessingRef.current = false;
    setIsMockProcessing(false);
  };

  const authenticateMockUser = async () => {
    const result = await loginWithMicrosoft();

    if (result?.status === LOGIN_RESULT_STATUS.APP_STEP_UP_REQUIRED) {
      throw new Error(getSafeAuthErrorMessage(AUTH_ERROR_CODES.UNKNOWN));
    }

    if (result?.status !== LOGIN_RESULT_STATUS.AUTHENTICATED || !result?.user) {
      throw new Error(
        getSafeAuthErrorMessage(AUTH_ERROR_CODES.MICROSOFT_EXCHANGE_FAILED)
      );
    }

    loginWithMicrosoftIdentity(result.user, {
      isMock: Boolean(result.isMock || isMockAuthEnabled),
      rememberMe: true,
    });
  };

  const handleMockFlowComplete = async () => {
    if (mockProcessingRef.current) {
      return;
    }

    setErrorMessage("");
    clearPendingAuthentication?.();

    mockProcessingRef.current = true;
    setIsMockProcessing(true);

    try {
      await authenticateMockUser();
      setShowMockFlow(false);
      setShowSuccess(true);
    } catch (error) {
      setShowMockFlow(false);
      setErrorMessage(
        getSafeAuthErrorMessage(
          error?.code,
          error instanceof Error
            ? error.message
            : getSafeAuthErrorMessage(AUTH_ERROR_CODES.MICROSOFT_UNAVAILABLE)
        )
      );
      finishMockProcessing();
    }
  };

  const handleSuccessRedirect = useCallback(() => {
    finishMockProcessing();
    setShowSuccess(false);
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleClick = () => {
    if (isBusy) {
      return;
    }

    setErrorMessage("");

    if (isMockAuthEnabled) {
      setShowMockFlow(true);
      return;
    }

    startSignIn();
  };

  const handleCancelMock = () => {
    if (isMockProcessing) {
      return;
    }
    setShowMockFlow(false);
    triggerRef.current?.focus?.();
  };

  const buttonClassName = className || "sso-btn microsoft-btn";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={buttonClassName}
        onClick={handleClick}
        disabled={isBusy}
        aria-busy={isBusy}
        aria-haspopup={isMockAuthEnabled ? "dialog" : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-label="Continue with Microsoft"
      >
        <MicrosoftIcon />
        <span className="sso-btn-label">
          {isBusy ? "Signing in with Microsoft..." : "Sign In with Microsoft"}
        </span>
      </button>

      {errorMessage ? (
        <p id={errorId} className="sso-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <MicrosoftMockSignInFlow
        open={showMockFlow}
        onCancel={handleCancelMock}
        onComplete={handleMockFlowComplete}
      />

      {showSuccess ? (
        <Suspense fallback={null}>
          <MfaVerificationSuccess
            open
            onRedirect={handleSuccessRedirect}
            ariaLabel="Microsoft sign-in successful. Redirecting to your dashboard."
          />
        </Suspense>
      ) : null}
    </>
  );
}

export default MicrosoftSSOButton;
