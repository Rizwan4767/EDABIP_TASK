import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import LeftTopLogo from "../../../assets/Authv2/left top logo.svg";
import BottomLogo from "../../../assets/Authv2/bottomlogo.svg";
import BgCircle from "../../../assets/Authv2/bgcircle.jpg";
import BgLock from "../../../assets/Authv2/bglock.png";

import RealTimeAnalytics from "../../../assets/Authv2/Real-Time Analytics.svg";
import AiPoweredInsights from "../../../assets/Authv2/AI-Powered Insights.svg";
import EnterpriseSecurity from "../../../assets/Authv2/Enterprise Security.svg";
import ScalablePlatform from "../../../assets/Authv2/Scalable Platform.svg";
import TrustedShieldIcon from "../../../assets/Authv2/Trusted by leading Enterprises worldwide.svg";

import { requestPasswordReset } from "../api/authApi.js";

import "./AccountLockedForm.css";

const LOCKED_EMAIL_STORAGE_KEY = "edabip_locked_email";

const FEATURES = [
  {
    src: RealTimeAnalytics,
    alt: "Real-Time Analytics",
    label: "Real-Time Analytics",
    description: "Monitor metrics and performance in real-time",
  },
  {
    src: AiPoweredInsights,
    alt: "AI-Powered Insights",
    label: "AI-Powered Insights",
    description: "Discover patterns and predict outcome",
  },
  {
    src: EnterpriseSecurity,
    alt: "Enterprise Security",
    label: "Enterprise Security",
    description: "Bank-grade security and data governance",
  },
  {
    src: ScalablePlatform,
    alt: "Scalable Platform",
    label: "Scalable Platform",
    description: "Build for performance and enterprise",
  },
];

function readLockedEmail(location) {
  const fromState =
    typeof location.state?.email === "string" ? location.state.email.trim() : "";

  if (fromState) {
    return fromState;
  }

  try {
    return sessionStorage.getItem(LOCKED_EMAIL_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export default function AccountLockedForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState("locked");
  const [email, setEmail] = useState(() => readLockedEmail(location));
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (emailError) setEmailError("");
  };

  const handleUnlock = async (event) => {
    event.preventDefault();
    setEmailError("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Resetting the password is what actually clears locked_until server-side
      // (see reset_password() in auth.py) — so "unlock" here means "send a
      // reset link", same endpoint as Forgot Password.
      const result = await requestPasswordReset(trimmedEmail);

      if (!result.success) {
        setEmailError(
          result.error?.message || "Something went wrong. Please try again."
        );
        return;
      }

      if (import.meta.env.DEV && result.devResetLink) {
        console.info("[DEV] Password reset link:", result.devResetLink);
      }

      setEmail(trimmedEmail);
      setStep("sent");
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="acl-page">
      <div className="acl-wrapper">
        <img src={BgCircle} alt="" className="acl-bg-circle" />

        <div className="acl-content">
          <div className="acl-left-panel">
            <div className="acl-brand">
              <img src={LeftTopLogo} alt="EDABIP" className="acl-logo" />
            </div>

            <div className="acl-welcome">
              <h1 className="acl-welcome-title">Welcome to EDABIP</h1>
              <p className="acl-welcome-text">
                Sign in to access your Enterprise Data Analytics &amp; Business
                Intelligence Platform and continue making data-driven decisions
                with confidence
              </p>
            </div>

            <div className="acl-feature-list">
              {FEATURES.map((feature) => (
                <div className="acl-feature-item" key={feature.alt}>
                  <div className="acl-feature-icon">
                    <img src={feature.src} alt="" />
                  </div>
                  <div className="acl-feature-text">
                    <h3>{feature.label}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="acl-trust-badge">
              <img
                src={TrustedShieldIcon}
                alt=""
                className="acl-trust-badge-icon"
              />
              <span>Trusted by leading Enterprises worldwide</span>
            </div>

            <div className="acl-footer">
              <p className="acl-footer-trust">
                Trusted by Fortune 500 companies worldwide
              </p>
              <p className="acl-footer-copyright">
                © 2026 EDABIP. Enterprise Data Analytics &amp; Business
                Intelligence Platform.
              </p>
            </div>
          </div>

          <div className="acl-card">
            {step === "locked" ? (
              <>
                <h2 className="acl-card-title">Account Temporarily Locked</h2>
                <p className="acl-card-subtitle">
                  We detected multiple failed sign-in attempts. For your
                  security, access to your account has been temporarily
                  restricted.
                </p>

                <form onSubmit={handleUnlock} className="acl-form" noValidate>
                  <div className="acl-field">
                    <div className="acl-input-wrap">
                      <input
                        type="email"
                        id="acl-email"
                        name="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Enter Your Email"
                        className={`acl-input${emailError ? " acl-input--error" : ""}`}
                        aria-invalid={Boolean(emailError)}
                        autoComplete="email"
                        disabled={isSubmitting}
                        required
                      />
                      <label htmlFor="acl-email">Enter Your Email</label>
                    </div>
                    {emailError ? (
                      <p className="acl-field-error">{emailError}</p>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    className="acl-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Unlock Account"}
                  </button>
                </form>

                <p className="acl-account-line">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="acl-account-link"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Back to Login
                  </a>
                </p>
              </>
            ) : (
              <>
                <h2 className="acl-card-title">Check Your Email</h2>
                <p className="acl-card-subtitle">
                  If an account exists for{" "}
                  <strong className="acl-card-email">{email}</strong>, we have
                  sent a password reset link to your inbox. Resetting your
                  password will also unlock your account.
                </p>

                <button
                  type="button"
                  className="acl-btn"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>
              </>
            )}

            <p className="acl-help">
              Need help?{" "}
              <a
                href="/contact-support"
                className="acl-help-link"
                onClick={(event) => {
                  event.preventDefault();
                  navigate("/contact-support");
                }}
              >
                Contact Support
              </a>
            </p>
          </div>

          <div className="acl-right-panel">
            <img src={BgLock} alt="" className="acl-bg-lock" />
          </div>
        </div>

        <img src={BottomLogo} alt="EDABIP" className="acl-float-logo" />
      </div>
    </div>
  );
}
