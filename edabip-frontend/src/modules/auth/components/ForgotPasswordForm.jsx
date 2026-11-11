import { useState } from "react";
import { useNavigate } from "react-router-dom";

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

import ErrorToast from "./ErrorToast.jsx";
import SuccessToast from "../../user-management/components/SuccessToast.jsx";

import "./ForgotPasswordForm.css";

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

function ForgotPasswordForm() {
  const navigate = useNavigate();

  // "request" -> enter email, "sent" -> confirmation screen
  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toast, setToast] = useState({
    type: null,
    isOpen: false,
  });

  const handleToastClose = () => {
    setToast({
      type: null,
      isOpen: false,
    });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handleSendReset = async (e) => {
    e.preventDefault();
    setEmailError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await requestPasswordReset(email.trim());
      console.log("API result:", result);

      if (!result.success) {
        if (result.error?.code === "EMAIL_NOT_FOUND") {
          setToast({ type: "error", isOpen: true });
        } else {
          setToast({ type: "generic-error", isOpen: true }); 
        }
        return;
      }

      // Dev-only convenience
      if (import.meta.env.DEV && result.devResetLink) {
        console.info("[DEV] Password reset link:", result.devResetLink);
      }

      setToast({
        type: "success",
        isOpen: true,
      });
      setStep("sent");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Password reset failed:", error);
      setToast({ type: "error", isOpen: true });
    }


    finally { 
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fp-page">
      <SuccessToast
        isOpen={toast.isOpen && toast.type === "success"}
        title="Reset Mail Sent"
        message="We have sent a password reset link to your inbox. Please check the Inbox."
        onClose={handleToastClose}
      />

      <ErrorToast
        isOpen={toast.isOpen && toast.type === "error"}
        title="Email Not Found"
        message="No account is associated with this email address."
        onClose={handleToastClose}
      />
      <div className="fp-wrapper">
        <img src={BgCircle} alt="" className="fp-bg-circle" />

        <div className="fp-content">
          <div className="fp-left-panel">
            <div className="fp-brand">
              <img src={LeftTopLogo} alt="EDABIP" className="fp-logo" />
            </div>

            <div className="fp-welcome">
              <h1 className="fp-welcome-title">Welcome to EDABIP</h1>
              <p className="fp-welcome-text">
                Sign in to access your Enterprise Data Analytics &amp; Business
                Intelligence Platform and continue making data-driven decisions
                with confidence
              </p>
            </div>

            <div className="fp-feature-list">
              {FEATURES.map((feature) => (
                <div className="fp-feature-item" key={feature.alt}>
                  <div className="fp-feature-icon">
                    <img src={feature.src} alt="" />
                  </div>
                  <div className="fp-feature-text">
                    <h3>{feature.label}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="fp-trust-badge">
              <img
                src={TrustedShieldIcon}
                alt=""
                className="fp-trust-badge-icon"
              />
              <span>Trusted by leading Enterprises worldwide</span>
            </div>

            <div className="fp-footer">
              <p className="fp-footer-trust">
                Trusted by Fortune 500 companies worldwide
              </p>
              <p className="fp-footer-copyright">
                © 2026 EDABIP. Enterprise Data Analytics &amp; Business
                Intelligence Platform.
              </p>
            </div>
          </div>

          <div className="fp-card">
            {step === "request" && (
              <>
                <h2 className="fp-card-title">Forgot Password</h2>
                <p className="fp-card-subtitle">
                  No worries! Enter your email address and we&apos;ll send you
                  instructions to reset your password.
                </p>

                <form onSubmit={handleSendReset} className="fp-form">
                  <div className="fp-field">
                    <div className="fp-input-wrap">
                      <input
                        type="email"
                        id="fp-email"
                        name="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Enter Your Email"
                        className={`fp-input ${emailError ? "fp-input--error" : ""}`}
                        aria-invalid={Boolean(emailError)}
                        autoComplete="email"
                        required
                      />
                      <label htmlFor="fp-email">Enter Your Email</label>
                    </div>
                    {emailError && (
                      <p className="fp-field-error">{emailError}</p>
                    )}
                  </div>

                  <button type="submit" className="fp-btn" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Reset"}
                  </button>
                </form>

                <p className="fp-account-line">
                  Already have an account?{" "}

                  <a href="/login"
                    className="fp-account-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  >
                    Back to Login
                  </a>
                </p>

                <p className="fp-help">
                  Need help?{" "}
                  <a
                    href="/contact-support"
                    className="fp-help-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/contact-support");
                    }}
                  >
                    Contact Support
                  </a>
                </p>
              </>
            )}

            {step === "sent" && (
              <>
                <h2 className="fp-card-title">Check Your Email</h2>
                <p className="fp-card-subtitle">
                  If an account exists for{" "}
                  <strong className="fp-card-email">{email}</strong>, we have
                  sent a password reset link to your inbox.
                </p>

                <button
                  type="button"
                  className="fp-btn"
                  onClick={() => navigate("/login")}
                >
                  Back to Login
                </button>

                <p className="fp-help">
                  Need help?{" "}
                  <a
                    href="/contact-support"
                    className="fp-help-link"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/contact-support");
                    }}
                  >
                    Contact Support
                  </a>
                </p>
              </>
            )}
          </div>

          <div className="fp-right-panel">
            <img src={BgLock} alt="" className="fp-bg-lock" />
          </div>
        </div>

        <img src={BottomLogo} alt="EDABIP" className="fp-float-logo" />
      </div>
    </div>
  );
}

export default ForgotPasswordForm;