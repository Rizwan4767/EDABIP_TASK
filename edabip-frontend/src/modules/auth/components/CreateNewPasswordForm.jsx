import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authApi.js";
 
import warningFieldImg from "../../../assets/login/Vectorplaceholder.png";
import bgcircle from "../../../assets/Authv2/bgcircle.jpg";
import bglock from "../../../assets/Authv2/bglock.png";
import trust from "../../../assets/Authv2/Trusted by leading Enterprises worldwide.svg";
import scalablePlatform from "../../../assets/Authv2/Scalable Platform.svg";
import SuccessCheckIcon from "../../../assets/dashboard/users/toast-check.svg";
import realtimeAnalytics from "../../../assets/Authv2/Real-Time Analytics.svg";
import AiPoweredInsights from "../../../assets/Authv2/AI-Powered Insights.svg";
import enterpriseSecurity from "../../../assets/Authv2/Enterprise Security.svg";
import eye from "../../../assets/Authv2/SecurePasswordeye.svg";
import PasswordWrong from "../../../assets/Authv2/PasswordWrong.svg";
import leftTopLogo from "../../../assets/Authv2/left top logo.svg";
import bottomlogo from "../../../assets/Authv2/bottomlogo.svg";

import "./CreateNewPasswordForm.css";

const FEATURES = [
  {
    src: realtimeAnalytics,
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
    src: enterpriseSecurity,
    alt: "Enterprise Security",
    label: "Enterprise Security",
    description: "Bank-grade security and data governance",
  },
  {
    src: scalablePlatform,
    alt: "Scalable Platform",
    label: "Scalable Platform",
    description: "Build for performance and enterprise",
  },
];

function getPasswordStrength(password) {
  if (!password) {
    return {
      level: "",
      score: 0,
      rules: {
        minLength: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    };
  }

  const rules = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(rules).filter(Boolean).length;

  const level =
    score <= 2
      ? "Weak"
      : score === 3
        ? "Fair"
        : score === 4
          ? "Good"
          : "Strong";

  return { level, score, rules };
}

function PasswordToggleIcon({ visible }) {
  if (visible) {
    return (
      <svg width="23" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M1 12.5C2.73 8.11 7 5 12 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.89 1 12.5z"
          stroke="#134B4A"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12.5" r="3" stroke="#134B4A" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <img src={eye} alt="Show Password" style={{ width: 23, height: 20 }} />
  );
}

function passwordRequirementMessage(rules) {
  if (!rules.minLength) return "Password must be atleast 8 characters";
  if (!rules.uppercase || !rules.special) {
    return "Password must contain: Uppercase Letter, Special Character";
  }
  return null;
}

function CreateNewPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [tokenError, setTokenError] = useState("");


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (!showSuccessToast) return;

    const timer = window.setTimeout(() => {
      setShowSuccessToast(false);
      navigate("/password-reset-success", { replace: true });
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [showSuccessToast, navigate]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const isPasswordValid =
    strength.rules.minLength &&
    strength.rules.uppercase &&
    strength.rules.special;

  const isUpdateDisabled =
    !password.trim() ||
    !isPasswordValid ||
    !confirmPassword.trim() ||
    isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTokenError("");

    if (!token) {
      setTokenError(
        "This reset link is invalid or missing. Please request a new one."
      );
      return;
    }

    let hasError = false;

    if (!password.trim() || !isPasswordValid) {
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Your passwords do not match");
      hasError = true;
    } else {
      setConfirmPasswordError("");
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    const result = await resetPassword({ token, newPassword: password });

    setIsSubmitting(false);

    if (!result.success) {
      setTokenError(
        result.error?.message ||
          "This reset link has expired or is invalid. Please request a new one."
      );
      return;
    }

    setShowSuccessToast(true);
  };

  return (
    <div className="cnp-container">
      {showSuccessToast && (
      <div
        className="cnp-success-toast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <img
          src={SuccessCheckIcon}
          alt=""
          className="cnp-success-toast-icon"
          width="42"
          height="42"
        />

        <div className="cnp-success-toast-content">
          <p className="cnp-success-toast-title">
            Password Reset Successful
          </p>

          <p className="cnp-success-toast-message">
            Login with your new password
          </p>
        </div>

        <button
          type="button"
          className="cnp-success-toast-close"
          aria-label="Dismiss notification"
          onClick={() => {
            setShowSuccessToast(false);
            navigate("/password-reset-success", { replace: true });
          }}
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    )}

      <div className="cnp-background">
        <img src={bgcircle} alt="" className="cnp-background-image" />
      </div>

      <img src={leftTopLogo} alt="EDABIP" className="cnp-brand-logo" />

      <img
        src={bglock}
        alt="Lock Shield illustration"
        className="cnp-lock-bg-independent"
      />

      <div className="cnp-content">
        <div className="cnp-left-section">
          <div className="cnp-left-main-content">
            <div className="cnp-heading-group">
              <h1 className="cnp-welcome-heading">Welcome to EDABIP</h1>

              <p className="cnp-welcome-description">
                Create New Password to access your Enterprise Data Analytics &
                Business Intelligence Platform and continue making
                data-driven decisions with confidence
              </p>
            </div>

            <div className="cnp-features-container">
              {FEATURES.map((feature) => (
                <div key={feature.alt} className="cnp-feature-item">
                  <div className="cnp-feature-icon-box">
                    <img
                      src={feature.src}
                      alt={feature.alt}
                      className="cnp-feature-icon"
                    />
                  </div>

                  <div className="cnp-feature-text">
                    <span className="cnp-feature-title">{feature.label}</span>
                    <span className="cnp-feature-subtitle">
                      {feature.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cnp-trusted-badge">
              <img src={trust} alt="shield" className="cnp-trusted-icon" />
              <span>Trusted by leading Enterprises worldwide</span>
            </div>
          </div>

          <div className="cnp-left-footer">
            <p className="cnp-footer-trusted">
              Trusted by Fortune 500 companies worldwide <br />
            </p>

            <p className="cnp-footer-copyright">
              © 2026 EDABIP. Enterprise Data Analytics & Business
              Intelligence Platform.
            </p>
          </div>
        </div>

        <div className="cnp-right-section">
          <div
            className={`cnp-card${
              password ? " cnp-card--filled" : " cnp-card--empty"
            }`}
          >
            <h2 className="cnp-title">Create New Password</h2>

            <p className="cnp-subtitle">
              Create New Password to continue to your EDABIP dashboard and
              accelerate your analytics journey
            </p>

            {tokenError && (
              <div className="cnp-confirm-error" style={{ marginBottom: 16 }}>
                <span>{tokenError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="cnp-form">
              <div className="cnp-form-group">
                <div className="cnp-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="cnp-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError("");
                    
                    }}
                    placeholder="Enter Your Password"
                    required
                  />

                  <label htmlFor="cnp-password">Enter Your Password</label>

                  <button
                    type="button"
                    className={`cnp-password-toggle${
                      password && !isPasswordValid
                        ? " cnp-password-toggle--has-warning"
                        : ""
                    }`}
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <PasswordToggleIcon visible={showPassword} />
                  </button>

                  {password && !isPasswordValid && (
                    <span className="cnp-warning-icon">
                      <img
                        src={warningFieldImg}
                        alt="weak password"
                        style={{ width: 15, height: 15 }}
                      />
                    </span>
                  )}
                </div>

                {password && (
                  <div className="cnp-field-error">
                    {passwordRequirementMessage(strength.rules)}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="cnp-form-group">
                {confirmPasswordError ? (
                  <div className="cnp-confirm-error">
                    <span>{confirmPasswordError}</span>
                    <img
                      src={
                        confirmPasswordError === "Your passwords do not match"
                          ? PasswordWrong
                          : warningFieldImg
                      }
                      alt="error"
                      className="cnp-confirm-error-icon"
                    />
                  </div>
                ) : (
                  <div className="cnp-input-wrapper cnp-input-wrapper--confirm">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="cnp-confirm-password"
                      value={confirmPassword}
                      placeholder="Confirm Your Password"
                      aria-label="Confirm Your Password"
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");  
                      }}
                      required
                    />

                    <label htmlFor="cnp-confirm-password">Confirm Your Password</label>

                    <button
                      type="button"
                      className="cnp-password-toggle"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      <PasswordToggleIcon visible={showConfirmPassword} />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className={`cnp-submit-btn ${
                  isUpdateDisabled ? "cnp-submit-disabled" : ""
                }`}
                disabled={isUpdateDisabled}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </button>
            </form>

            <div className="cnp-support-group">
              <p className="cnp-support-text">
                Need help?{" "}
                <button
                  type="button"
                  className="cnp-support-link"
                  onClick={() => navigate("/contact-support")}
                >
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <img src={bottomlogo} alt="" className="cnp-bottom-logo" />
    </div>
  );
}

export default CreateNewPasswordForm;
