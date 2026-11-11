import { useId, useRef, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { fetchGoogleProfile } from "../services/googleAuthService.js";
import {
  isMockAuthEnabled,
  MOCK_AUTH_UNAVAILABLE_MESSAGE,
} from "../utils/mockSession.js";

function GoogleIcon() {
  return (
    <svg
      className="btn-icon"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function SSOButton({ provider, className, icon }) {
  const navigate = useNavigate();
  const { loginWithGoogleMock, clearPendingAuthentication } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const processingRef = useRef(false);
  const errorId = useId();
  const normalizedProvider =
    typeof provider === "string" ? provider.trim().toLowerCase() : "";

  const finishProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);
  };

  const googleLogin = useGoogleLogin({
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        if (!isMockAuthEnabled) {
          throw new Error(MOCK_AUTH_UNAVAILABLE_MESSAGE);
        }

        if (!tokenResponse?.access_token) {
          throw new Error("Google did not return a valid access token.");
        }

        const profile = await fetchGoogleProfile(tokenResponse.access_token);

        if (!profile?.sub || !profile?.email) {
          throw new Error("Google returned an incomplete user profile.");
        }

        const user = {
          id: String(profile.sub),
          name: typeof profile.name === "string" ? profile.name : "",
          email: String(profile.email),
          picture: typeof profile.picture === "string" ? profile.picture : "",
          provider: "google",
        };

        // Development only. Replace this call with a backend credential
        // exchange; the backend must verify Google and issue the real session.
        loginWithGoogleMock(user);
        navigate("/dashboard", { replace: true });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Google sign-in failed. Please try again."
        );
      } finally {
        finishProcessing();
      }
    },
    onError: () => {
      setErrorMessage("Google sign-in failed. Please try again.");
      finishProcessing();
    },
    onNonOAuthError: () => {
      setErrorMessage("Google sign-in was cancelled or could not be opened.");
      finishProcessing();
    },
  });

  const handleClick = () => {
    if (processingRef.current) {
      return;
    }

    setErrorMessage("");

    if (normalizedProvider !== "google") {
      setErrorMessage("This sign-in provider is not supported.");
      return;
    }

    if (!isMockAuthEnabled) {
      setErrorMessage(MOCK_AUTH_UNAVAILABLE_MESSAGE);
      return;
    }

    // Switching providers must clear any incomplete email MFA challenge.
    clearPendingAuthentication?.();

    processingRef.current = true;
    setIsProcessing(true);

    try {
      googleLogin();
    } catch {
      setErrorMessage("Google sign-in could not be started. Please try again.");
      finishProcessing();
    }
  };

  const buttonClassName =
    className || `sso-btn ${normalizedProvider || "unknown"}-btn`;

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        onClick={handleClick}
        disabled={isProcessing}
        aria-busy={isProcessing}
        aria-describedby={errorMessage ? errorId : undefined}
        aria-label="Sign in with Google"
      >
        {icon || <GoogleIcon />}
        {isProcessing ? "Signing in with Google..." : "Sign in with Google"}
      </button>

      {errorMessage && (
        <p id={errorId} className="sso-error" role="alert">
          {errorMessage}
        </p>
      )}
    </>
  );
}

export default SSOButton;
