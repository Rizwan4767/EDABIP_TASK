import { useState, useEffect, useRef, useCallback } from "react";
import "./SignupForm.css";
import { useNavigate, Link, useLocation } from "react-router-dom";

import LeftTopLogo from "../../../assets/Authv2/left top logo.svg";
import BottomLogo from "../../../assets/Authv2/bottomlogo.svg";
import BgCircle from "../../../assets/Authv2/bgcircle.jpg";
import BgLock from "../../../assets/Authv2/bglock.png";

import RealTimeAnalytics from "../../../assets/Authv2/Real-Time Analytics.svg";
import AiPoweredInsights from "../../../assets/Authv2/AI-Powered Insights.svg";
import EnterpriseSecurity from "../../../assets/Authv2/Enterprise Security.svg";
import ScalablePlatform from "../../../assets/Authv2/Scalable Platform.svg";

import SecurePasswordEye from "../../../assets/Authv2/SecurePasswordeye.svg";
import redInfoIcon from "../../../assets/negative-state/red-info-icon.png";

import { useAuthContext } from "../../../context/AuthContext.jsx";
import {
  extractErrorMessage,
  resendEmailOtp,
  verifyEmailOtp,
} from "../api/authApi.js";
import MicrosoftSSOButton from "./MicrosoftSSOButton.jsx";
import GoogleSSOButton from "./GoogleSSOButton.jsx";
import ErrorToast from "./ErrorToast.jsx";
import SuccessToast from "../../user-management/components/SuccessToast.jsx";

// Negative-state toast 
const OTP_FAILED_TITLE = "OTP verified unsuccessfully";
const OTP_FAILED_MESSAGE =
  "We couldn’t verify the OTP you entered. Please check the code and try again.";

// Positive-state toast copy.
const OTP_SENT_TITLE = "Verification Code Sent";
const OTP_SENT_MESSAGE = "A secure 4-digit OTP has been sent to your Email.";
const OTP_VERIFIED_TITLE = "OTP verified successfully";
const OTP_VERIFIED_MESSAGE = "You will be Redirecting to the Login Page";
const OTP_VERIFIED_REDIRECT_DELAY_MS = 1500;

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

const RESEND_SECONDS = 30;
const OTP_LENGTH = 4;

const PASSWORD_REQUIREMENTS = [
  { key: "uppercase", label: "Uppercase Letter" },
  { key: "lowercase", label: "Lowercase Letter" },
  { key: "number", label: "Number" },
  { key: "special", label: "Special Character" },
  { key: "minLength", label: "8+ Characters" },
];

function getPasswordRules(password) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordErrorMessage(password) {
  if (!password) {
    return "Please enter a password";
  }

  const rules = getPasswordRules(password);

  if (!rules.minLength) {
    return "Password must be at least 8 characters";
  }

  const missing = PASSWORD_REQUIREMENTS.filter(
    ({ key }) => key !== "minLength" && !rules[key]
  ).map(({ label }) => label);

  if (missing.length > 0) {
    return `Password must contain: ${missing.join(", ")}`;
  }

  return "";
}

const SignupForm = () => {
  const otpInputRefs = useRef([]);
  const redirectTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { signup } = useAuthContext();

  // Clear the pending post-verification redirect if the user navigates away
  // (or the component otherwise unmounts) before the timer fires.
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const maskPassword = (value) => "*".repeat(value.length);

  const [step, setStep] = useState(
    location.state?.needsVerification ? "verify" : "signup"
  );
  const [otpDigits, setOtpDigits] = useState(() => Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [resendSeconds, setResendSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [errorToast, setErrorToast] = useState(null);
  const dismissErrorToast = useCallback(() => {
    setErrorToast(null);
  }, []);

  // `title` defaults to the signup-form copy so every existing call site
  // (which only ever passed a message) keeps behaving exactly as before.
  const showErrorToast = useCallback((message, title = "Unable to create account") => {
    setErrorToast({
      id: Date.now(),
      title,
      message: message || "Please fix the errors below and try again",
    });
  }, []);

  const [successToast, setSuccessToast] = useState(null);
  const dismissSuccessToast = useCallback(() => {
    setSuccessToast(null);
  }, []);

  const showSuccessToast = useCallback((message, title) => {
    setSuccessToast({
      id: Date.now(),
      title,
      message,
    });
  }, []);

  const otp = otpDigits.join("");
  const otpComplete = otpDigits.every((digit) => digit !== "");
  const isExpiredOtpError = otpError === "Invalid OTP";

  const [formData, setFormData] = useState({
    firstName: location.state?.firstName || "",
    lastName: location.state?.lastName || "",
    companyName: location.state?.companyName || "",
    email: location.state?.email || "",
    password: "",
    confirmPassword: "",
    companySize: "",
    industry: "",
  });

  const destination = formData.email;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    if (formError) {
      setFormError("");
    }

    dismissErrorToast();
  };

  const validateSignupForm = () => {
    const nextErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = "Please enter your first name";
    } else if (formData.firstName.trim().length > 80) {
      nextErrors.firstName = "First name must be 80 characters or fewer";
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Please enter your last name";
    } else if (formData.lastName.trim().length > 80) {
      nextErrors.lastName = "Last name must be 80 characters or fewer";
    }

    // Company fields are currently hidden in the UI — skip required checks.
    // if (!formData.companyName.trim()) {
    //   nextErrors.companyName = "Please enter your company name";
    // }

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email";
    }

    if (!formData.password) {
      nextErrors.password = "Please enter a password";
    } else {
      const passwordError = getPasswordErrorMessage(formData.password);
      if (passwordError) {
        nextErrors.password = passwordError;
      }
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Please retype your password";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    // Company size / industry are currently hidden in the UI — skip required checks.
    // if (!formData.companySize) {
    //   nextErrors.companySize = "Please select your company size";
    // }
    // if (!formData.industry) {
    //   nextErrors.industry = "Please select your industry";
    // }

    if (!agreedToTerms) {
      nextErrors.terms = "Please accept the Terms & Conditions";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const beginOtpStep = () => {
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setStep("verify");
    setResendSeconds(RESEND_SECONDS);
    showSuccessToast(OTP_SENT_MESSAGE, OTP_SENT_TITLE);
  };

  const isFormComplete =
    Boolean(formData.firstName.trim()) &&
    Boolean(formData.lastName.trim()) &&
    Boolean(formData.email.trim()) &&
    Boolean(formData.password) &&
    Boolean(formData.confirmPassword) &&
    agreedToTerms;

  const showSignupFieldError = (field, message) => {
    setFieldErrors({ [field]: message });
    showErrorToast(message);
  };

  const recoverExistingEmailSignup = async (result) => {
    try {
      const resend = await resendEmailOtp(formData.email.trim());
      if (resend.isFullyVerified) {
        showSignupFieldError("email", "This email is already registered. Please log in.");
        return;
      }
      beginOtpStep();
    } catch {
      showSignupFieldError("email", result.error?.message || "Unable to create your account.");
    }
  };

  const handleSignupFailure = async (result) => {
    if (result.error?.code === "EMAIL_ALREADY_EXISTS") {
      await recoverExistingEmailSignup(result);
      return;
    }

    const field = result.error?.field;
    const message = result.error?.message || "Unable to create your account.";

    if (field && field !== "mobileNumber") {
      showSignupFieldError(field, message);
      return;
    }

    setFormError(message);
    showErrorToast(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormComplete || isSubmitting) {
      return;
    }

    dismissErrorToast();

    if (!validateSignupForm()) {
      showErrorToast();
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const result = await signup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
        companyName: formData.companyName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        companySize: formData.companySize,
        industry: formData.industry,
      });

      if (!result.success) {
        await handleSignupFailure(result);
        return;
      }

      beginOtpStep();
    } catch (error) {
      const errMsg = extractErrorMessage(error);
      setFormError(errMsg);
      showErrorToast(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!location.state?.needsVerification || !formData.email) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        await resendEmailOtp(formData.email.trim());
        if (!cancelled) {
          setResendSeconds(RESEND_SECONDS);
        }
      } catch {
        // User can still tap Resend OTP.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formData.email, location.state?.needsVerification]);

  useEffect(() => {
    if (step !== "verify" || resendSeconds <= 0) return undefined;

    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [step, resendSeconds]);

  const handleOtpBoxChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, "").slice(-1);

    if (otpError) {
      setOtpError("");
    }

    const next = [...otpDigits];
    next[index] = value;
    setOtpDigits(next);

    if (value && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpBoxKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otpError) {
        setOtpError("");
      }

      const next = [...otpDigits];

      if (otpDigits[index]) {
        next[index] = "";
        setOtpDigits(next);
        return;
      }

      if (index > 0) {
        next[index - 1] = "";
        setOtpDigits(next);
        otpInputRefs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, i) => {
      next[i] = digit;
    });
    setOtpDigits(next);
    if (otpError) setOtpError("");
    otpInputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0) return;

    try {
      const resend = await resendEmailOtp(formData.email.trim());
      if (resend.isFullyVerified) {
        setOtpError("This email is already verified. Please log in.");
        return;
      }
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setResendSeconds(RESEND_SECONDS);
      showSuccessToast(OTP_SENT_MESSAGE, OTP_SENT_TITLE);
    } catch (error) {
      setOtpError(extractErrorMessage(error));
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otpComplete) return;

    setIsVerifying(true);
    setOtpError("");

    try {
      const verifyResponse = await verifyEmailOtp({
        email: formData.email.trim().toLowerCase(),
        otp,
      });

      if (!verifyResponse.success) {
        setOtpError("Invalid OTP");
        showErrorToast(OTP_FAILED_MESSAGE, OTP_FAILED_TITLE);
        return;
      }

      showSuccessToast(OTP_VERIFIED_MESSAGE, OTP_VERIFIED_TITLE);
      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/login", {
          state: {
            otpVerified: true,
            destination: formData.email.trim(),
            method: "email",
          },
        });
      }, OTP_VERIFIED_REDIRECT_DELAY_MS);
    } catch (error) {
      setOtpError(extractErrorMessage(error) || "Invalid OTP");
      showErrorToast(OTP_FAILED_MESSAGE, OTP_FAILED_TITLE);
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimer = (seconds) => `00:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="sft-page signup-page">
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
                Sign in to access your Enterprise Data Analytics & Business
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

          {step === "signup" && (
            <div className="sft-form-card">
              <h2 className="sft-form-title">Welcome Back</h2>
              <p className="sft-form-subtitle">
                Sign into continue to your EADBIP dashboard and accelerate your
                analytics journey
              </p>

              <div className="toggle">
                <button
                  type="button"
                  className="toggle-btn active"
                >
                  Sign up
                </button>

                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
              </div>

              <form className="sft-form" onSubmit={handleSubmit} noValidate>
                <div className="sft-floating-field">
                  <input
                    type="text"
                    name="firstName"
                    id="signup-first-name"
                    placeholder="Enter Your First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`sft-input ${fieldErrors.firstName ? "sft-input--error" : ""}`}
                    autoComplete="given-name"
                    disabled={isSubmitting}
                    required
                  />
                  <label htmlFor="signup-first-name">Enter Your First Name</label>
                </div>
                {fieldErrors.firstName && (
                  <p className="sft-field-error">{fieldErrors.firstName}</p>
                )}

                <div className="sft-floating-field">
                  <input
                    type="text"
                    name="lastName"
                    id="signup-last-name"
                    placeholder="Enter Your Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`sft-input ${fieldErrors.lastName ? "sft-input--error" : ""}`}
                    autoComplete="family-name"
                    disabled={isSubmitting}
                    required
                  />
                  <label htmlFor="signup-last-name">Enter Your Last Name</label>
                </div>
                {fieldErrors.lastName && (
                  <p className="sft-field-error">{fieldErrors.lastName}</p>
                )}

                <div className="sft-floating-field">
                  <input
                    type="email"
                    name="email"
                    id="signup-email"
                    placeholder="Enter Your Email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`sft-input ${fieldErrors.email ? "sft-input--error" : ""}`}
                    autoComplete="email"
                    disabled={isSubmitting}
                    required
                  />
                  <label htmlFor="signup-email">Enter Your Email</label>
                </div>
                {fieldErrors.email && (
                  <p className="sft-field-error">{fieldErrors.email}</p>
                )}

                <div className="sft-floating-password">
                  <input
                    type="text"
                    name="password"
                    id="signup-password"
                    placeholder="Enter Your Password"
                    value={showPassword ? formData.password : maskPassword(formData.password)}
                    onChange={(e) => {
                      if (showPassword) {
                        handleChange(e);
                        return;
                      }

                      const typedValue = e.target.value;

                      if (typedValue.length > formData.password.length) {
                        const newChar = typedValue.at(-1);

                        setFormData((prev) => ({
                          ...prev,
                          password: prev.password + newChar,
                        }));
                      } else if (typedValue.length < formData.password.length) {
                        setFormData((prev) => ({
                          ...prev,
                          password: prev.password.slice(0, -1),
                        }));
                      }

                      if (fieldErrors.password) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.password;
                          return next;
                        });
                      }

                      dismissErrorToast();
                    }}
                    className={`sft-input ${fieldErrors.password ? "sft-input--error" : ""
                      }`}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />

                  <label htmlFor="signup-password">Enter Your Password</label>

                  {showPassword ? (
                    <svg
                      className="sft-eye-icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#0d3b32"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <img
                      src={SecurePasswordEye}
                      alt="toggle password"
                      className="sft-eye-icon"
                      onClick={() => setShowPassword((prev) => !prev)}
                    />
                  )}
                </div>

                {fieldErrors.password && (
                  <p className="sft-field-error">{fieldErrors.password}</p>
                )}

                <div className="sft-floating-password">
                  <input
                    type="text"

                    name="confirmPassword"
                    id="signup-confirm-password"
                    placeholder="Confirm Your Password"
                    value={showPassword ? formData.confirmPassword : maskPassword(formData.confirmPassword)}

                    onChange={(e) => {
                      const typedValue = e.target.value;

                      if (typedValue.length > formData.confirmPassword.length) {
                        const newChar = typedValue.at(-1);

                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: prev.confirmPassword + newChar,
                        }));
                      } else if (typedValue.length < formData.confirmPassword.length) {
                        setFormData((prev) => ({
                          ...prev,
                          confirmPassword: prev.confirmPassword.slice(0, -1),
                        }));
                      }

                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.confirmPassword;
                          return next;
                        });
                      }

                      dismissErrorToast();
                    }}
                    className={`sft-input ${fieldErrors.confirmPassword ? "sft-input--error" : ""
                      }`}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />

                  <label htmlFor="signup-confirm-password">Confirm Your Password</label>
                </div>

                {fieldErrors.confirmPassword && (
                  <p className="sft-field-error">{fieldErrors.confirmPassword}</p>
                )}

                <label className="sft-terms-row">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (fieldErrors.terms) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.terms;
                          return next;
                        });
                      }
                      dismissErrorToast();
                    }}
                    disabled={isSubmitting}
                  />
                  <span className="sft-terms-text">
                    I agree to Terms & Conditions
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="sft-field-error">{fieldErrors.terms}</p>
                )}

                {formError && <p className="sft-form-error">{formError}</p>}

                <button
                  type="submit"
                  className="sft-submit-btn"
                  disabled={!isFormComplete || isSubmitting}
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </button>

                <p className="sft-login-redirect">
                  Already have an account?{" "}
                  <Link to="/login" className="sft-login-link">
                    Login
                  </Link>
                </p>
              </form>

              <div className="sft-divider">
                <span>or sign up with</span>
              </div>

              <div className="sft-social-icons">
                <GoogleSSOButton className="sft-social-btn" />
                <MicrosoftSSOButton className="sft-social-btn sft-social-btn--ms" />
              </div>

              <p className="sft-help-text">
                Need help ? <Link to="/contact-support">Contact Support</Link>
              </p>
            </div>
          )}

          {step === "verify" && (
            <div className="fp-card fp-card--verify">
              <h2 className="fp-card-title">Enter Verification Code</h2>
              <p className="fp-card-subtitle">
                We&apos;ve sent a 4-digit verification code to{" "}
                <strong className="fp-card-email">{destination}</strong>
                {" "}(email). Check your inbox and spam folder. Your account
                stays unverified until you enter this code.
              </p>

              <form
                onSubmit={handleVerifyOtp}
                className="fp-form fp-form--verify"
              >
                <div className="fp-otp-boxes" onPaste={handleOtpPaste}>
                  {Array.from({ length: OTP_LENGTH }, (_, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        otpInputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      className={`fp-otp-box ${otpError
                          ? "fp-otp-box--error"
                          : otpDigits[index]
                            ? "fp-otp-box--filled"
                            : ""
                        }`}
                      placeholder="*"
                      value={otpDigits[index]}
                      onChange={(e) => handleOtpBoxChange(index, e)}
                      onKeyDown={(e) => handleOtpBoxKeyDown(index, e)}
                      onFocus={(e) => e.target.select()}
                      maxLength={1}
                      autoFocus={index === 0}
                      aria-label={`OTP digit ${index + 1}`}
                      disabled={isVerifying}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="fp-otp-error">
                    <span>{otpError}</span>
                    {isExpiredOtpError && (
                      <img
                        src={redInfoIcon}
                        alt=""
                        className="fp-otp-error-icon"
                      />
                    )}
                  </div>
                )}

                <div className="fp-resend-row">
                  <span>Didn&apos;t receive the code?</span>
                  <button
                    type="button"
                    className={`fp-resend-link ${resendSeconds > 0 ? "fp-resend-link--disabled" : ""
                      }`}
                    onClick={handleResendOtp}
                    disabled={resendSeconds > 0 || isVerifying}
                  >
                    Resend OTP
                  </button>
                </div>

                <div className="fp-resend-timer-row">
                  <span>Resend OTP</span>
                  <span>{formatTimer(resendSeconds)}</span>
                </div>

                <button
                  type="submit"
                  className={`fp-btn ${otpComplete && !otpError ? "" : "fp-btn--disabled"
                    }`}
                  disabled={!otpComplete || !!otpError || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify OTP"}
                </button>
              </form>

              <p className="fp-help">
                Need help?{" "}
                <Link to="/contact-support" className="fp-help-link">
                  Contact Support
                </Link>
              </p>
            </div>
          )}

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
        duration={4000}
        onClose={dismissErrorToast}
      />

      <SuccessToast
        key={successToast?.id}
        isOpen={Boolean(successToast)}
        title={successToast?.title}
        message={successToast?.message}
        duration={4000}
        onClose={dismissSuccessToast}
      />
    </div>
  );
};

export default SignupForm;