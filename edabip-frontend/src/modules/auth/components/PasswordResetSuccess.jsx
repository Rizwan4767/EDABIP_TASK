import backgroundImg from "../../../assets/Authv2/bgcircle.jpg";
import lockBackgroundImg from "../../../assets/Authv2/bglock.png";
import logoImg from "../../../assets/Authv2/left top logo.svg";
import bottomLogoImg from "../../../assets/Authv2/bottomlogo.svg";
import trust from "../../../assets/Authv2/Trusted by leading Enterprises worldwide.svg";
import featureAnalytics from "../../../assets/Authv2/Real-Time Analytics.svg";
import featureAi from "../../../assets/Authv2/AI-Powered Insights.svg";
import featureSecurity from "../../../assets/Authv2/Enterprise Security.svg";
import featureScalable from "../../../assets/Authv2/Scalable Platform.svg";
import { Link } from "react-router-dom";
import './PasswordResetSuccess.css';

const FEATURES = [
  {
    src: featureAnalytics,
    alt: 'Real-Time Analytics',
    label: 'Real-Time Analytics',
    description: 'Monitor metrics and performance in real-time',
  },
  {
    src: featureAi,
    alt: 'AI-Powered Insights',
    label: 'AI-Powered Insights',
    description: 'Discover patterns and predict outcome',
  },
  {
    src: featureSecurity,
    alt: 'Enterprise Security',
    label: 'Enterprise Security',
    description: 'Bank-grade security and data governance',
  },
  {
    src: featureScalable,
    alt: 'Scalable Platform',
    label: 'Scalable Platform',
    description: 'Build for performance and enterprise',
  },
];

function SuccessIcon() {
  return (
    <div className="prs-icon-wrap" aria-hidden="true">
      <svg
        viewBox="-14 -14 122 122"
        width="94"
        height="94"
        className="prs-success-img"
        role="presentation"
        focusable="false"
      >
        <defs>
          <radialGradient id="prsSuccessGradient" cx="50%" cy="48%" r="62%">
            <stop offset="0%" stopColor="#2DE7E7" />
            <stop offset="42%" stopColor="#1BBFC6" />
            <stop offset="76%" stopColor="#0F4F57" />
            <stop offset="100%" stopColor="#0A2B33" />
          </radialGradient>

          <filter id="prsSuccessDepth" x="-28%" y="-28%" width="156%" height="156%">
            <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#20D8DE" floodOpacity="0.25" />
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#062228" floodOpacity="0.28" />
          </filter>

          <filter id="prsSuccessInnerShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feOffset dx="0" dy="4" />
            <feGaussianBlur stdDeviation="5" result="offsetBlur" />
            <feComposite operator="out" in="SourceGraphic" in2="offsetBlur" result="inverse" />
            <feFlood floodColor="#021A20" floodOpacity="0.42" result="shadowColor" />
            <feComposite operator="in" in="shadowColor" in2="inverse" result="innerShadow" />
            <feComposite operator="over" in="innerShadow" in2="SourceGraphic" />
          </filter>
        </defs>

        <g filter="url(#prsSuccessDepth)">
          <circle
            cx="47"
            cy="47"
            r="47"
            fill="url(#prsSuccessGradient)"
            filter="url(#prsSuccessInnerShadow)"
          />
        </g>

        <path
          d="M23.5 49.5L39.2 64L70.5 31.5"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

function PasswordResetSuccess() {
  return (
    <div className="prs-container">
      <div
        className="prs-background"
        style={{
          "--prs-background-image": `url(${backgroundImg})`,
        }}
      >
        <img src={lockBackgroundImg} alt="" className="prs-lock-bg-independent" />
      </div>

      <img src={logoImg} alt="EDABIP" className="prs-brand-logo" />

      <div className="prs-content">
        <div className="prs-left-section">
          <div className="prs-left-main-content">
            <div className="prs-heading-group">
              <h1 className="prs-welcome-heading">
                Welcome to EDABIP
              </h1>

              <p className="prs-welcome-description">
                Sign in to access your Enterprise Data Analytics & Business
                Intelligence Platform and continue making data-driven decisions
                with confidence
              </p>
            </div>

            <div className="prs-features-container">
              {FEATURES.map((f) => (
                <div key={f.alt} className="prs-feature-item">
                  <div className="prs-feature-icon-box">
                    <img src={f.src} alt={f.alt} className="prs-feature-icon" />
                  </div>

                  <div className="prs-feature-text">
                    <span className="prs-feature-title">{f.label}</span>
                    <span className="prs-feature-subtitle">{f.description}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="prs-trusted-badge">
              <img src={trust} alt="shield" className="prs-trusted-icon" />
              <span>Trusted by leading Enterprises worldwide</span>
            </div>
          </div>

          <div className="prs-left-footer">
            <p className="prs-footer-trusted">
              Trusted by Fortune 500 companies worldwide.<br />
                {"\u00A9"}  2026 EDABIP Enterprise Data Analytics & Business Intelligence Platform.
            </p>
          </div>
        </div>

        <div className="prs-right-section">
          <div className="prs-card">
            <SuccessIcon />

            <h2 className="prs-title">You're All Set!</h2>

            <p className="prs-subtitle">
              Your password has been reset successfully. Use your new
              password to securely access your EDABIP account.
            </p>

            <Link to="/login" className="prs-submit-btn">
              Login
            </Link>

            <p className="prs-support-text">
              Need help ?{' '}
              <span className="prs-support-link">Contact Support</span>
            </p>
          </div>
        </div>
      </div>

      <img src={bottomLogoImg} alt="EDABIP" className="prs-bottom-logo" />
    </div>
  );
}

export default PasswordResetSuccess;