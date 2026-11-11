import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MOCK_MICROSOFT_USER } from "../services/microsoftAuthService.js";
import "./MicrosoftMockSignInFlow.css";

const STEPS = {
  EMAIL: "email",
  PASSWORD: "password",
  MFA: "mfa",
};

function MicrosoftLogo() {
  return (
    <svg
      className="ms-flow-logo"
      width="108"
      height="24"
      viewBox="0 0 108 24"
      aria-hidden="true"
    >
      <rect x="0" y="0" width="11" height="11" fill="#F25022" />
      <rect x="12" y="0" width="11" height="11" fill="#7FBA00" />
      <rect x="0" y="12" width="11" height="11" fill="#00A4EF" />
      <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
      <text
        x="30"
        y="17"
        fill="#5e5e5e"
        fontFamily="Segoe UI, Arial, sans-serif"
        fontSize="16"
        fontWeight="600"
      >
        Microsoft
      </text>
    </svg>
  );
}

/**
 * Mock-only Microsoft hosted-UI lookalike for local demo auth.
 * Used only when VITE_ENABLE_MOCK_AUTH is true — not a real Microsoft login.
 */
function MicrosoftMockSignInFlow({ open = false, onCancel, onComplete }) {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState(MOCK_MICROSOFT_USER.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleId = useId();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    setStep(STEPS.EMAIL);
    setEmail(MOCK_MICROSOFT_USER.email);
    setPassword("");
    setError("");
    setIsSubmitting(false);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (step === STEPS.EMAIL) {
      emailInputRef.current?.focus();
    } else if (step === STEPS.PASSWORD) {
      passwordInputRef.current?.focus();
    }
  }, [open, step]);

  const approvalNumber = useMemo(() => {
    if (!open) {
      return "42";
    }
    return String(Math.floor(10 + Math.random() * 89));
  }, [open]);

  if (!open) {
    return null;
  }

  const handleEmailNext = (event) => {
    event.preventDefault();
    const normalized = String(email || "").trim().toLowerCase();

    if (!normalized || !normalized.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (normalized !== MOCK_MICROSOFT_USER.email.toLowerCase()) {
      setError(
        `Use the demo account: ${MOCK_MICROSOFT_USER.email}`
      );
      return;
    }

    setError("");
    setStep(STEPS.PASSWORD);
  };

  const handlePasswordNext = (event) => {
    event.preventDefault();

    if (!String(password || "").trim()) {
      setError("Please enter the password for your Microsoft account.");
      return;
    }

    setError("");
    setStep(STEPS.MFA);
  };

  const handleApprove = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onComplete?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't complete Microsoft sign-in. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isSubmitting) {
      return;
    }

    setError("");

    if (step === STEPS.PASSWORD) {
      setStep(STEPS.EMAIL);
      return;
    }

    if (step === STEPS.MFA) {
      setStep(STEPS.PASSWORD);
    }
  };

  return (
    <div
      className="ms-flow-overlay"
      role="presentation"
      onClick={(event) => {
        if (!isSubmitting && event.target === event.currentTarget) {
          onCancel?.();
        }
      }}
    >
      <div
        className="ms-flow-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ms-flow-card">
          <MicrosoftLogo />

          {step === STEPS.EMAIL ? (
            <form className="ms-flow-form" onSubmit={handleEmailNext}>
              <h2 id={titleId} className="ms-flow-title">
                Sign in
              </h2>
              <p className="ms-flow-subtitle">to continue to EDABIP</p>

              <label className="ms-flow-label" htmlFor="ms-mock-email">
                Email, phone, or Skype
              </label>
              <input
                ref={emailInputRef}
                id="ms-mock-email"
                type="email"
                className="ms-flow-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                disabled={isSubmitting}
              />

              {error ? (
                <p className="ms-flow-error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="ms-flow-hint">
                  Demo account: {MOCK_MICROSOFT_USER.email}
                </p>
              )}

              <div className="ms-flow-actions">
                <button type="submit" className="ms-flow-primary">
                  Next
                </button>
              </div>
            </form>
          ) : null}

          {step === STEPS.PASSWORD ? (
            <form className="ms-flow-form" onSubmit={handlePasswordNext}>
              <button
                type="button"
                className="ms-flow-identity"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <span aria-hidden="true">←</span>
                <span>{MOCK_MICROSOFT_USER.email}</span>
              </button>

              <h2 id={titleId} className="ms-flow-title">
                Enter password
              </h2>

              <label className="ms-flow-label" htmlFor="ms-mock-password">
                Password
              </label>
              <input
                ref={passwordInputRef}
                id="ms-mock-password"
                type="password"
                className="ms-flow-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                disabled={isSubmitting}
              />

              {error ? (
                <p className="ms-flow-error" role="alert">
                  {error}
                </p>
              ) : (
                <p className="ms-flow-hint">
                  Demo mode: enter any password to continue.
                </p>
              )}

              <div className="ms-flow-actions">
                <button type="submit" className="ms-flow-primary">
                  Sign in
                </button>
              </div>
            </form>
          ) : null}

          {step === STEPS.MFA ? (
            <div className="ms-flow-form">
              <button
                type="button"
                className="ms-flow-identity"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <span aria-hidden="true">←</span>
                <span>{MOCK_MICROSOFT_USER.email}</span>
              </button>

              <h2 id={titleId} className="ms-flow-title">
                Approve sign in request
              </h2>
              <p className="ms-flow-subtitle">
                Open your Authenticator app and tap the number you see below to
                sign in.
              </p>

              <div className="ms-flow-mfa-number" aria-live="polite">
                {approvalNumber}
              </div>

              <p className="ms-flow-mfa-help">
                We sent a notification to your Microsoft Authenticator app.
              </p>

              {error ? (
                <p className="ms-flow-error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="ms-flow-actions ms-flow-actions--stack">
                <button
                  type="button"
                  className="ms-flow-primary"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Verifying..." : "Approve"}
                </button>
                <button
                  type="button"
                  className="ms-flow-secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <p className="ms-flow-demo-badge">Microsoft demo sign-in (mock)</p>
      </div>
    </div>
  );
}

export default MicrosoftMockSignInFlow;
