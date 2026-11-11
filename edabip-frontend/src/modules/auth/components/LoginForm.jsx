import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./LoginForm.css";

import LeftTopLogo from "../../../assets/Authv2/left top logo.svg";
import BottomLogo from "../../../assets/Authv2/bottomlogo.svg";
import BgCircle from "../../../assets/Authv2/bgcircle.jpg";
import BgLock from "../../../assets/Authv2/bglock.png";

import RealTimeAnalytics from "../../../assets/Authv2/Real-Time Analytics.svg";
import AiPoweredInsights from "../../../assets/Authv2/AI-Powered Insights.svg";
import EnterpriseSecurity from "../../../assets/Authv2/Enterprise Security.svg";
import ScalablePlatform from "../../../assets/Authv2/Scalable Platform.svg";


import { useAuthContext } from "../../../context/AuthContext.jsx";
import { MOCK_LOGIN_MFA_OTP_LENGTH } from "../services/loginMfaService.js";
import { getOAuthErrorMessage } from "../services/oauthPopup.js";
import ErrorToast from "./ErrorToast.jsx";
import MfaVerificationModal from "./MfaVerificationModal.jsx";
import MicrosoftSSOButton from "./MicrosoftSSOButton.jsx";
import GoogleSSOButton from "./GoogleSSOButton.jsx";

const LOGIN_FAILED_TITLE = "Login Failed";
const GENERIC_CREDENTIALS_MESSAGE =
  "Please check your credentials and try again.";
const INVALID_CREDENTIALS_MESSAGE = "Invalid credentials";

const SIGN_IN_UNAVAILABLE_MESSAGE = "Unable to sign in. Please try again.";

const featureList = [
  {
    icon: RealTimeAnalytics,
    title: "Real-Time Analytics",
    desc: "Monitor metrics and performance in real-time",
  },
  {
    icon: AiPoweredInsights,
    title: "AI-Powered Insights",
    desc: "Discover patterns and predict outcome",
  },
  {
    icon: EnterpriseSecurity,
    title: "Enterprise Security",
    desc: "Bank-grade security and data governance",
  },
  {
    icon: ScalablePlatform,
    title: "Scalable Platform",
    desc: "Build for performance and enterprise",
  },
];

const EyeOpenIcon = () => (
  <svg
    width="22.35"
    height="19.8"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
      stroke="#134B4A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke="#134B4A" strokeWidth="2" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="23"
    height="20"
    viewBox="0 0 23 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15.3397 10.5L13.8667 9.05C14.019 8.26667 13.7905 7.53333 13.181 6.85C12.5714 6.16667 11.7841 5.9 10.819 6.05L9.34603 4.6C9.63386 4.46667 9.92593 4.36667 10.2222 4.3C10.5185 4.23333 10.836 4.2 11.1746 4.2C12.4444 4.2 13.5238 4.6375 14.4127 5.5125C15.3016 6.3875 15.746 7.45 15.746 8.7C15.746 9.03333 15.7122 9.34583 15.6444 9.6375C15.5767 9.92917 15.4751 10.2167 15.3397 10.5ZM18.5905 13.65L17.1175 12.25C17.7608 11.7667 18.3323 11.2375 18.8317 10.6625C19.3312 10.0875 19.7587 9.43333 20.1143 8.7C19.2677 7.01667 18.0529 5.67917 16.4698 4.6875C14.8868 3.69583 13.1217 3.2 11.1746 3.2C10.6836 3.2 10.2011 3.23333 9.72698 3.3C9.25291 3.36667 8.7873 3.46667 8.33016 3.6L6.75556 2.05C7.44974 1.76667 8.16085 1.55417 8.88889 1.4125C9.61693 1.27083 10.3788 1.2 11.1746 1.2C13.7312 1.2 16.0085 1.89583 18.0063 3.2875C20.0042 4.67917 21.4519 6.48333 22.3492 8.7C21.9598 9.68333 21.4476 10.5958 20.8127 11.4375C20.1778 12.2792 19.437 13.0167 18.5905 13.65ZM19.0984 19.8L14.8317 15.65C14.2392 15.8333 13.6423 15.9708 13.0413 16.0625C12.4402 16.1542 11.818 16.2 11.1746 16.2C8.61799 16.2 6.34074 15.5042 4.34286 14.1125C2.34497 12.7208 0.897354 10.9167 0 8.7C0.355556 7.81667 0.804233 6.99583 1.34603 6.2375C1.88783 5.47917 2.50582 4.8 3.2 4.2L0.406349 1.4L1.82857 0L20.5206 18.4L19.0984 19.8ZM4.62222 5.6C4.13122 6.03333 3.68254 6.50833 3.27619 7.025C2.86984 7.54167 2.52275 8.1 2.23492 8.7C3.08148 10.3833 4.2963 11.7208 5.87937 12.7125C7.46243 13.7042 9.22751 14.2 11.1746 14.2C11.5132 14.2 11.8434 14.1792 12.1651 14.1375C12.4868 14.0958 12.8169 14.05 13.1556 14L12.2413 13.05C12.055 13.1 11.8772 13.1375 11.7079 13.1625C11.5386 13.1875 11.3608 13.2 11.1746 13.2C9.90476 13.2 8.8254 12.7625 7.93651 11.8875C7.04762 11.0125 6.60317 9.95 6.60317 8.7C6.60317 8.51667 6.61587 8.34167 6.64127 8.175C6.66667 8.00833 6.70476 7.83333 6.75556 7.65L4.62222 5.6Z"
      fill="#134B4A"
    />
  </svg>
);
const ErrorInfoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="7" stroke="#c0392b" strokeWidth="1.4" />
    <rect x="7.25" y="6.5" width="1.5" height="5" rx="0.75" fill="#c0392b" />
    <circle cx="8" cy="4.4" r="0.9" fill="#c0392b" />
  </svg>
);

const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  const {
    login,
    verifyMfa,
    resendMfa,
    clearPendingAuthentication,
    pendingChallenge,
  } = useAuthContext();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaError, setMfaError] = useState("");
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [isResendingMfa, setIsResendingMfa] = useState(false);
  const [ssoError, setSsoError] = useState("");
  const [errorToast, setErrorToast] = useState(null);
  const submitButtonRef = useRef(null);

  const dismissErrorToast = useCallback(() => {
    setErrorToast(null);
  }, []);

  const showErrorToast = useCallback((message) => {
    setErrorToast({
      id: Date.now(),
      title: LOGIN_FAILED_TITLE,
      message,
    });
  }, []);

  useEffect(() => {
    if (pendingChallenge) {
      setShowMfaModal(true);
    }
  }, [pendingChallenge]);

  // A failed Google sign-in arrives here two different ways: OAuthCallback
  // hands the message over in route state, while oauth.py redirects a denied
  // consent straight to /login?oauth_error=<code>, never touching the callback.
  useEffect(() => {
    const stateError = location.state?.authError;
    const errorCode = new URLSearchParams(location.search).get("oauth_error");

    if (!stateError && !errorCode) {
      return;
    }

    setSsoError(stateError || getOAuthErrorMessage(errorCode));

    // Consume it, so a reload or a later visit does not resurface a stale
    // error. The rewritten location has neither source, so this effect's next
    // run exits above instead of looping.
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const isFormComplete =
    Boolean(formData.email.trim()) && Boolean(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete || isSubmitting) {
      return;
    }

    const nextErrors = {
      email: "",
      password: "",
    };

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email";
    }

    if (!formData.password) {
      nextErrors.password = "Please enter your password";
    }

    if (nextErrors.email || nextErrors.password) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({ email: "", password: "" });
    setMfaError("");

    try {
      const result = await login(
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        rememberMe
      );

      if (result.success) {
        navigate(from, { replace: true });
        return;
      }

      if (result.locked) {
        try {
          sessionStorage.setItem(
            "edabip_locked_email",
            formData.email.trim().toLowerCase()
          );
        } catch {
          // ignore storage failures
        }
        navigate("/account-locked", {
          state: { email: formData.email.trim() },
        });
        return;
      }

      if (result.verificationRequired) {
        navigate("/signup", {
          state: {
            email: formData.email.trim(),
            needsVerification: true,
          },
        });
        return;
      }

      if (result.mfaRequired) {
        setShowMfaModal(true);
        return;
      }

      setErrors({
        email: INVALID_CREDENTIALS_MESSAGE,
        password: INVALID_CREDENTIALS_MESSAGE,
      });

      showErrorToast(GENERIC_CREDENTIALS_MESSAGE);
      return;
    } catch {
      showErrorToast(SIGN_IN_UNAVAILABLE_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaVerify = async (code) => {
    setIsVerifyingMfa(true);
    setMfaError("");

    try {
      const result = await verifyMfa(code);

      if (result.success) {
        setShowMfaModal(false);
        navigate(from, { replace: true });
        return;
      }

      setMfaError(result.message || "Invalid verification code");
    } catch {
      setMfaError("Unable to verify the code. Please try again.");
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const handleMfaResend = async () => {
    setIsResendingMfa(true);
    setMfaError("");

    try {
      const result = await resendMfa();

      if (!result.success) {
        setMfaError(result.message || "Unable to resend the code.");
      }
    } catch {
      setMfaError("Unable to resend the code. Please try again.");
    } finally {
      setIsResendingMfa(false);
    }
  };

  const handleMfaClose = async () => {
    setShowMfaModal(false);
    setMfaError("");
    await clearPendingAuthentication();
  };

  return (
    <div className="sft-page login-page">
      <div className="sft-wrapper">
        <img src={BgCircle} alt="" className="sft-bg-circle" />

        <div className="sft-content">
          <div className="sft-left-panel">
            <div className="sft-left-top">
              <img src={LeftTopLogo} alt="EDABIP" className="sft-logo" />
            </div>

            <div className="sft-left-heading">
              <h1>Welcome to EDABIP</h1>
              <p>
                Log in to access your Enterprise Data Analytics & Business 
                Intelligence Platform and continue making data-driven decisions 
                with confidence
              </p>
            </div>

            <div className="sft-feature-list">
              {featureList.map((feature) => (
                <div className="sft-feature-item" key={feature.title}>
                  <div className="sft-feature-icon">
                    <img src={feature.icon} alt={feature.title} />
                  </div>
                  <div className="sft-feature-text">
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="sft-trusted-badge">
              <img src={EnterpriseSecurity} alt="" />
              <span>Trusted by leading Enterprises worldwide</span>
            </div>

            <div className="sft-left-footer">
              <p className="sft-footer-text">
                Trusted by Fortune 500 companies worldwide
              </p>
              <p>
                © 2026 EDABIP. Enterprise Data Analytics & Business Intelligence
                Platform.
              </p>
            </div>
          </div>

          <div className="sft-form-card">
            <h2 className="sft-form-title">Welcome Back</h2>
            <p className="sft-form-subtitle">
             Log in to continue to your EDABIP dashboard and accelerate your analytics journey
            </p>

            <div className="toggle">
              <button
                type="button"
                className="toggle-btn"
                onClick={() => navigate("/signup")}
              >
                Sign up
              </button>
              <button type="button" className="toggle-btn active">
                Log in
              </button>
            </div>

            <form className="sft-form" onSubmit={handleSubmit} noValidate>
              <div
                className={`sft-floating-field ${errors.email ? "error" : ""}`}
              >
                <input
                  type="email"
                  name="email"
                  id="login-email"
                  placeholder="Enter Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="sft-input email-input"
                  autoComplete="email"
                  aria-invalid={errors.email ? "true" : "false"}
                  disabled={isSubmitting}
                  required
                />

                <label htmlFor="login-email">Enter Your Email</label>
                {errors.email && (
                  <span className="error-icon" style={{ display: "flex" }}>
                    <ErrorInfoIcon />
                  </span>
                )}
              </div>
              
              <div
                className={`password-wrap ${errors.password ? "error" : ""}`}>

                <div
                  className={`password-wrapper ${errors.password ? "error" : ""}`}>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="login-password"
                    placeholder="Enter Your Password"

                    value={formData.password}
                    onChange={handleChange}
                    className="sft-input password-input"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    disabled={isSubmitting}
                    required
                  />

                  <label htmlFor="login-password">Enter Your Password</label>
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <div className="field-error">
                  {errors.password}
                </div>
              )}
              <div className="row-between">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe((prev) => !prev)}
                    disabled={isSubmitting}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary"
                ref={submitButtonRef}
                disabled={!isFormComplete || isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Login"}
              </button>

              <p className="signup-line">
                Don&apos;t have an account?{" "}
                <Link to="/signup">Sign up</Link>
              </p>
            </form>

            <div className="sft-divider">
              <span>or sign up with</span>
            </div>

            {ssoError ? (
              <p className="sso-error" role="alert">
                {ssoError}
              </p>
            ) : null}

            <div className="sft-social-icons">
              <GoogleSSOButton className="sft-social-btn" />
              <MicrosoftSSOButton className="sft-social-btn sft-social-btn--ms" />
            </div>

            <p className="sft-help-text">
              Need help ? <Link to="/contact-support">Contact Support</Link>
            </p>
          </div>

          <div className="sft-right-panel">
            <img src={BgLock} alt="" className="sft-bg-lock" />
          </div>
        </div>

        <img src={BottomLogo} alt="EDABIP" className="sft-bottom-logo" />
      </div>

      <ErrorToast
        key={errorToast?.id}
        isOpen={Boolean(errorToast)}
        title={errorToast?.title}
        message={errorToast?.message}
        duration={7000}
        onClose={dismissErrorToast}
      />

      <MfaVerificationModal
        open={showMfaModal && Boolean(pendingChallenge)}
        title="Verify Your Email"
        description="Enter the verification code sent to your email to finish signing in."
        method={pendingChallenge?.method}
        maskedDestination={pendingChallenge?.maskedDestination || formData.email}
        expiresInSeconds={pendingChallenge?.expiresInSeconds || 300}
        resendAvailableInSeconds={
          pendingChallenge?.resendAvailableInSeconds || 120
        }
        otpLength={MOCK_LOGIN_MFA_OTP_LENGTH}
        isSubmitting={isVerifyingMfa}
        isResending={isResendingMfa}
        error={mfaError}
        onVerify={handleMfaVerify}
        onResend={handleMfaResend}
        onClose={handleMfaClose}
        returnFocusRef={submitButtonRef}
      />
    </div>
  );
};

export default LoginForm;
