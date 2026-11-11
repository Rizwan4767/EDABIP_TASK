import { useState } from "react";
import "./Start-Free-Trail.css";

import Logo from "../../assets/start-free-trail/Logo.svg";
import MiddleBg from "../../assets/start-free-trail/middle-bg.png";

import CalendarIcon from "../../assets/start-free-trail/fluent-mdl2_date-time.svg";
import TimeIcon from "../../assets/start-free-trail/tdesign_time_blue.svg";
import SecureIcon from "../../assets/start-free-trail/tdesign_secured.svg";

import CardIcon from "../../assets/start-free-trail/famicons_card-outline.svg";
import SettingsIcon from "../../assets/start-free-trail/tabler_settings_black.svg";
import ClockIcon from "../../assets/start-free-trail/tdesign_time_black.svg";

// New icons for bottom-features row
import GraphIcon from "../../assets/start-free-trail/Graph.svg";
import StarIcon from "../../assets/start-free-trail/Star.svg";
import SettingsBlueIcon from "../../assets/start-free-trail/tabler_settings_blue.svg";
import FileIcon from "../../assets/start-free-trail/icons_file.svg";
import EllipseBg from "../../assets/start-free-trail/Ellipse-2039.svg";

const NameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const CompanyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#667085" strokeWidth="2">
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" width="16" height="16">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const StartFreeTrail = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const {
      firstName,
      lastName,
      email,
      company,
      password,
      confirmPassword,
      agree,
    } = formData;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !company ||
      !password ||
      !confirmPassword
    ) {
      setError("Please fill all the required columns.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agree) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setError("");
    // TODO: replace with actual submit logic (API call, redirect, etc.)
    console.log("Form submitted:", formData);
  };

  return (
    <section className="start-free-trial">

      {/* ================= NAVBAR ================= */}

      <header className="sft-navbar">
        <div className="sft-logo">
          <img src={Logo} alt="EDABIP Logo" />
        </div>

        <nav className="sft-nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About Us</a>
        </nav>

        <button className="demo-btn">
          Book a Demo
        </button>
      </header>

      {/* ================= HERO ================= */}

      <div className="hero-wrapper">
        <div className="sft-hero-content">
          <span className="sft-hero-badge">GET STARTED</span>

          <h1 className="sft-hero-title">
            Book a <span className="sft-hero-title-accent">Demo</span>
          </h1>

          <p className="sft-hero-subtitle">
            See how EDABIP can help you streamline operations,
            gain real-time insights, and drive better results.
          </p>

          <div className="sft-hero-points">
            <div className="sft-hero-point">
              <div className="sft-hero-point-icon">
                <img src={CalendarIcon} alt="" />
              </div>
              <h5 className="sft-hero-point-text">Personalized Walkthrough</h5>
            </div>

            <div className="sft-hero-point">
              <div className="sft-hero-point-icon">
                <img src={TimeIcon} alt="" />
              </div>
              <h5 className="sft-hero-point-text">15-30 Minutes Session</h5>
            </div>

            <div className="sft-hero-point">
              <div className="sft-hero-point-icon">
                <img src={SecureIcon} alt="" />
              </div>
              <h5 className="sft-hero-point-text">No Commitment</h5>
            </div>
          </div>
        </div>

        <div className="hero-middle">
          <div className="dashboard-wrapper">
            <img src={MiddleBg} alt="Dashboard" className="dashboard-image" />
          </div>
        </div>

        <div className="hero-right">
          <div className="account-form">

            <div className="form-header">
              <div className="form-icon">
                <img src={SecureIcon} alt="Secure" />
              </div>
              <h2>Create Your Account</h2>
              <p>Start your free trial and experience the power of EDABIP.</p>
            </div>

            <form className="demo-form" onSubmit={handleSubmit}>

              <div className="form-row">

                <div className="input-group">
                  <label>Full Name *</label>
                  <div className="input-icon-wrap">
                    <NameIcon />
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your full name"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Last Name *</label>
                  <div className="input-icon-wrap">
                    <NameIcon />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              <div className="input-group">
                <label>Work Email *</label>
                <div className="input-icon-wrap">
                  <MailIcon />
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your work email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Company Name *</label>
                <div className="input-icon-wrap">
                  <CompanyIcon />
                  <input
                    type="text"
                    name="company"
                    placeholder="Enter your company name"
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">

                <div className="input-group">
                  <label>Phone Number</label>
                  <div className="input-icon-wrap">
                    <PhoneIcon />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password *</label>
                  <div className="input-icon-wrap">
                    <LockIcon />
                    <input
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>

              <div className="input-group">
                <label>Confirm Password *</label>
                <div className="input-icon-wrap">
                  <LockIcon />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agree"
                  name="agree"
                  checked={formData.agree}
                  onChange={handleChange}
                />
                <label htmlFor="agree">
                  I agree to the
                  <a href="/"> Terms of Service </a>
                  and
                  <a href="/"> Privacy Policy</a>.
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="trial-btn">
                Start Free Trial <ArrowIcon />
              </button>

            </form>
        </div>
            <div className="form-footer">

              <div className="footer-item">
                <img src={CardIcon} alt="" />
                <span>No Credit Card Required</span>
              </div>

              <div className="footer-item">
                <img src={SettingsIcon} alt="" />
                <span>Full Access to All Features</span>
              </div>

              <div className="footer-item">
                <img src={ClockIcon} alt="" />
                <span>Cancel Anytime, Hassle Free</span>
              </div>

            </div>

          </div>
        </div>
      {/* End hero-wrapper */}

      {/* ================= BOTTOM FEATURES ================= */}

      <section className="bottom-features">

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={GraphIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>Real-Time Dashboards</h4>
            <p>Monitor business performance with interactive dashboards.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={StarIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>AI-Powered Analytics</h4>
            <p>Get advanced insights and predictive intelligence.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={SettingsBlueIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>Workflow Automation</h4>
            <p>Automate tasks and save time across your business.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={CalendarIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>Smart Integrations</h4>
            <p>Connect with your favorite tools and platforms.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={SecureIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>Enterprise Security</h4>
            <p>Role-based access and data protection you can trust.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-round">
            <img src={EllipseBg} alt="" className="feature-icon-bg" />
            <img src={FileIcon} alt="" className="feature-icon-fg" />
          </div>
          <div className="feature-content">
            <h4>Custom Reports</h4>
            <p>Create custom reports and visualize your data.</p>
          </div>
        </div>

      </section>

    </section>
  );
};

export default StartFreeTrail;