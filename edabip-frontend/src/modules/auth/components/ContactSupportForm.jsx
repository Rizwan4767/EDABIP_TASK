import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImg from '../../../assets/temp-block/contact-support-bg.jpg';
import logoImg from '../../../assets/login/logo.png';
import headsetIcon from '../../../assets/temp-block/HeadsetIcon.png';
import sendIcon from '../../../assets/temp-block/SendIcon.png';
import mailChannelIcon from '../../../assets/temp-block/MailIcon.png';
import liveChatIcon from '../../../assets/temp-block/LiveChatIcon.png';
import phoneChannelIcon from '../../../assets/temp-block/PhoneIcon.png';
import helpCenterIcon from '../../../assets/temp-block/HelpCenterIcon.png';
import './ContactSupportForm.css';

const SUBJECTS = [
  'Sign in issues',
  'Password reset',
  'Account locked',
  'Billing & payments',
  'Technical problem',
  'Other',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MailChannelIcon() {
  return <img src={mailChannelIcon} alt="" className="cs-channel-icon" />;
}

function LiveChatIcon() {
  return <img src={liveChatIcon} alt="" className="cs-channel-icon" />;
}

function PhoneChannelIcon() {
  return <img src={phoneChannelIcon} alt="" className="cs-channel-icon" />;
}

function HelpCenterIcon() {
  return <img src={helpCenterIcon} alt="" className="cs-channel-icon" />;
}

function HeadsetIcon() {
  return <img src={headsetIcon} alt="" className="cs-headset-icon" />;
}

function UserFieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  );
}

function MailFieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SendIcon() {
  return <img src={sendIcon} alt="" className="cs-send-icon" />;
}

function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const CHANNELS = [
  {
    icon: <MailChannelIcon />,
    label: 'Email Support',
    highlight: 'support@edabip.com',
    description: 'We typically reply within 24hours',
  },
  {
    icon: <LiveChatIcon />,
    label: 'Live Chat',
    description: 'Chat with our support team',
    extra: 'Available 24/7',
  },
  {
    icon: <PhoneChannelIcon />,
    label: 'Phone Support',
    highlight: '+91 1800 123 4567',
    description: 'Mon - Fri: 9AM - 6PM',
  },
  {
    icon: <HelpCenterIcon />,
    label: 'Help Center',
    description: "Browse FAQ's & Documentation",
  },
];

function ContactSupportForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitted(false);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your full name';
    }
    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (!form.subject) {
      nextErrors.subject = 'Please select a subject';
    }
    if (!form.message.trim()) {
      nextErrors.message = 'Please describe your issue';
    }
    return nextErrors;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  const handleBackToSignIn = () => {
    navigate('/login');
  };

  return (
    <div className="cs-container">
      <div className="cs-background">
        <img src={backgroundImg} alt="" className="cs-background-image" />
      </div>

      <div className="cs-content">
        <div className="cs-left-section">
          <img src={logoImg} alt="EDABIP" className="cs-brand-logo" />

          <h1 className="cs-welcome-heading">
            Contact <span className="cs-purple-text">Support</span>
          </h1>

          <p className="cs-welcome-description">
            We're available whenever you need help.
          </p>

          <div className="cs-channels-container">
            {CHANNELS.map((channel) => (
              <div key={channel.label} className="cs-channel-item">
                <div className="cs-channel-icon-wrapper">{channel.icon}</div>
                <div className="cs-channel-text">
                  <span className="cs-channel-label">{channel.label}</span>
                  {channel.highlight && (
                    <span className="cs-channel-highlight">{channel.highlight}</span>
                  )}
                  <p className="cs-channel-description">{channel.description}</p>
                  {channel.extra && (
                    <p className="cs-channel-description">{channel.extra}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cs-right-section">
          <div className="cs-card">
            <div className="cs-headset-icon-container">
              <HeadsetIcon />
            </div>

            <h2 className="cs-title">Contact Support</h2>

            <p className="cs-description">
              Need help signing in? Our support team is here to help.
            </p>

            <form className="cs-form" onSubmit={handleSubmit} noValidate>
              <div className="cs-field">
                <label className="cs-field-label" htmlFor="cs-name">Name</label>
                <div className="cs-input-wrapper">
                  <span className="cs-input-icon"><UserFieldIcon /></span>
                  <input
                    id="cs-name"
                    type="text"
                    className="cs-input"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange('name')}
                  />
                </div>
                {errors.name && <p className="cs-field-error">{errors.name}</p>}
              </div>

              <div className="cs-field">
                <label className="cs-field-label" htmlFor="cs-email">Email Address</label>
                <div className="cs-input-wrapper">
                  <span className="cs-input-icon"><MailFieldIcon /></span>
                  <input
                    id="cs-email"
                    type="email"
                    className="cs-input"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={handleChange('email')}
                  />
                </div>
                {errors.email && <p className="cs-field-error">{errors.email}</p>}
              </div>

              <div className="cs-field">
                <label className="cs-field-label" htmlFor="cs-subject">Subject</label>
                <div className="cs-input-wrapper">
                  <select
                    id="cs-subject"
                    className={`cs-input cs-select${form.subject ? '' : ' cs-select-placeholder'}`}
                    value={form.subject}
                    onChange={handleChange('subject')}
                  >
                    <option value="" disabled>Select a subject</option>
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  <span className="cs-select-chevron"><ChevronDownIcon /></span>
                </div>
                {errors.subject && <p className="cs-field-error">{errors.subject}</p>}
              </div>

              <div className="cs-field">
                <label className="cs-field-label" htmlFor="cs-message">Message</label>
                <textarea
                  id="cs-message"
                  className="cs-input cs-textarea"
                  placeholder="Describe your issues"
                  value={form.message}
                  onChange={handleChange('message')}
                  rows={1}
                />
                {errors.message && <p className="cs-field-error">{errors.message}</p>}
              </div>

              <div className={`cs-secure-note${submitted ? ' cs-secure-note--success' : ''}`}>
                <span className="cs-secure-icon"><ShieldCheckIcon /></span>
                <span>
                  {submitted
                    ? 'Your request has been securely submitted.'
                    : 'Your request is securely Submitted,'}
                </span>
              </div>

              <button type="submit" className="cs-primary-btn">
                <SendIcon />
                Send a Request
              </button>

              <button type="button" className="cs-secondary-btn" onClick={handleBackToSignIn}>
                <ArrowLeftIcon />
                Back to Sign In
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactSupportForm;
