import { useNavigate } from 'react-router-dom';
import backgroundImg from '../../../assets/temp-block/background.png';
import logoImg from '../../../assets/login/logo.png';
import Ecllipse from '../../../assets/temp-block/Ellipse.png';
import bg from '../../../assets/temp-block/bg.png';
import matinfo from '../../../assets/temp-block/mat-info.png';
import lock from '../../../assets/temp-block/mat-lock.png';
import loop from '../../../assets/temp-block/loop.png';
import featureSecureReset from '../../../assets/login/feature-secure-reset.png';
import featureProtectAccount from '../../../assets/login/feature-protect-account.png';
import featureQuickEasy from '../../../assets/login/feature-quick-easy.png';
import './SessionExpiredForm.css';

const FEATURES = [
  {
    src: featureQuickEasy,
    alt: 'Secure Reset Link',
    label: 'Secure Reset Link',
    description: "We'll send you a secure link to reset your password.",
  },
  {
    src: featureProtectAccount,
    alt: 'Protect Your Account',
    label: 'Protect Your Account',
    description: 'We take extra steps to keep your account safe.',
  },
  {
    src: featureSecureReset,
    alt: 'Quick & Easy',
    label: 'Quick & Easy',
    description: 'Reset your password in just a few simple steps.',
  },
];

function LockWithClockIcon() {
  return (
    <div className="se-lock-icon-container">
      <img src={Ecllipse} alt="" className="se-card-logo-icon-outerline" />
      <img src={bg} alt="" className="se-card-logo-icon-innerline" />
    </div>
  );
}

function InfoIcon() {
  return (
    <div className="se-info-icon-container">
      <img src={matinfo} alt="" className="se-info-icon" />
    </div>
  );
}

function RefreshIcon() {
  return (
    <div className="se-loop-icon-container">
      <img src={loop} alt="" className="se-loop-icon" />
    </div>
  );
}

function LockIcon() {
  return (
    <img src={lock} alt="" className="se-lock-icon" />
  );
}

function SessionExpiredForm() {
  const navigate = useNavigate();

  const handleStartAgain = () => {
    navigate('/login');
  };

  const handleBackToSignIn = () => {
    navigate('/');
  };

  return (
    <div className="se-container">
      <div className="se-background">
        <img src={backgroundImg} alt="" className="se-background-image" />
      </div>

      <div className="se-content">
        <div className="se-left-section">
          <img src={logoImg} alt="EDABIP" className="se-brand-logo" />

          <h1 className="se-welcome-heading">
            Reset your <span className="se-purple-text">Password</span>
          </h1>

          <p className="se-welcome-description">
            No worries! Let's help you set a new password and get back to your account.
          </p>

          <div className="se-features-container">
            {FEATURES.map((feature) => (
              <div key={feature.alt} className="se-feature-item">
                <div className="se-feature-icon-wrapper">
                  <img src={feature.src} alt={feature.alt} className="se-feature-svg-badge" />
                </div>
                <div className="se-feature-text">
                  <span className="se-feature-label">{feature.label}</span>
                  <p className="se-feature-description">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="se-right-section">
          <div className="se-card">
            <LockWithClockIcon />

            <h2 className="se-title">Session Expired</h2>

            <p className="se-subtitle">
              <span className="se-red-text">Your session has expired.</span>
            </p>

            <p className="se-description">
              For your security, your session has timed out due to inactivity.
            </p>

            <div className="se-info-box">
              <div className="se-info-icon-wrapper">
                <InfoIcon />
              </div>
              <div className="se-info-text">
                <p className="se-info-title">What does this means?</p>
                <p className="se-info-description">
                  To protect your account, we've ended your current session. Please start again.
                </p>
              </div>
            </div>

            <button type="button" className="se-primary-btn" onClick={handleStartAgain}>
              <RefreshIcon />
              Start Again
            </button>

            <button type="button" className="se-secondary-btn" onClick={handleBackToSignIn}>
              Back to Sign In
            </button>

            <div className="se-support-container">
              <p className="se-support-text">
                <span className="se-support-icon"><LockIcon /></span>
                <span className="se-support-body">
                  If you continue to have trouble, please try again later or{' '}
                  <span className="se-support-link">contact support</span>{' '}for assistance
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredForm;
