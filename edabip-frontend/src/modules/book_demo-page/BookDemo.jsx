import "./BookDemo.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../components/language-selector/LanguageSelector.jsx";

import Logo from "../../assets/book_demo-page/Logo.svg";
import FooterLogoMark from "../../assets/landing-page/logo.png";
import DownArrow from "../../assets/book_demo-page/down-arrow.svg";
import MainBg from "../../assets/book_demo-page/book-demo-bg.jpg";
import PersonIllustration from "../../assets/book_demo-page/Copilot-bg.png.png";
import CalendarIcon from "../../assets/book_demo-page/calender.svg";

import PersonalizedIcon from "../../assets/book_demo-page/personalized.svg";
import SessionIcon from "../../assets/book_demo-page/Session.svg";
import CommitmentIcon from "../../assets/book_demo-page/commitment.svg";

import IconUser from "../../assets/book_demo-page/icon_user.svg";
import IconMail from "../../assets/book_demo-page/icon_mail.svg";
import IconPhone from "../../assets/book_demo-page/icon_phoneNo.svg";
import IconJob from "../../assets/book_demo-page/icon_job.svg";
import IconCompany from "../../assets/book_demo-page/icon_company.svg";
import IconDate from "../../assets/book_demo-page/icon_date.svg";
import IconTime from "../../assets/book_demo-page/icon_time.svg";
import IconLock from "../../assets/book_demo-page/icon_lock.svg";
import IconPen from "../../assets/book_demo-page/icon_pen.svg";
import ContactSupportIcon from "../../assets/book_demo-page/contactsupport.svg";

const heroPoints = [
  { icon: PersonalizedIcon, key: "personalized", labelWidth: 92 },
  { icon: SessionIcon, key: "session", labelWidth: 99 },
  { icon: CommitmentIcon, key: "commitment", labelWidth: 88 },
];

const hearAboutUsOptions = [
  { value: "google", key: "google" },
  { value: "social", key: "social" },
  { value: "referral", key: "referral" },
  { value: "blog", key: "blog" },
  { value: "event", key: "event" },
  { value: "other", key: "other" },
];

const initialFormState = {
  fullName: "",
  workEmail: "",
  phoneNumber: "",
  jobTitle: "",
  companyName: "",
  hearAboutUs: "",
  preferredDate: "",
  preferredTime: "",
  message: "",
};

export default function BookDemo() {
  const { t } = useTranslation("bookDemo");
  const { t: tCommon } = useTranslation("common");

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Native <input type="date"/"time"> ignore the placeholder attribute and
  // always render the browser's own "dd-mm-yyyy" / "--:--" format. To show
  // the Figma-specced "Select date" / "Select time" placeholders, the field
  // stays type="text" until it's focused or already has a value — at which
  // point it becomes a real date/time input so the native picker still works
  // and a chosen value still renders in the browser's native format.
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isTimeFocused, setIsTimeFocused] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
  };

  const validate = () => {
    const nextErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9+()\-\s]{7,}$/;

    if (!form.fullName.trim()) nextErrors.fullName = t("form.validation.fullNameRequired");

    if (!form.workEmail.trim()) {
      nextErrors.workEmail = t("form.validation.workEmailRequired");
    } else if (!emailPattern.test(form.workEmail)) {
      nextErrors.workEmail = t("form.validation.emailInvalid");
    }

    if (!form.phoneNumber.trim()) {
      nextErrors.phoneNumber = t("form.validation.phoneRequired");
    } else if (!phonePattern.test(form.phoneNumber)) {
      nextErrors.phoneNumber = t("form.validation.phoneInvalid");
    }

    if (!form.companyName.trim()) nextErrors.companyName = t("form.validation.companyRequired");

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      console.log("Book demo payload:", form);
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="book-demo-page">
      {/* Top Menu — same translation keys + LanguageSelector as the Landing Page header */}
      <header className="bd-header">
        <div className="bd-header-inner">
          <Link to="/" className="bd-logo" aria-label={tCommon("brand.homeAria")}>
            <img src={Logo} alt="" aria-hidden="true" />
          </Link>

          <div className="bd-header-actions">
            <Link to="/login" className="bd-btn bd-btn--login">
              {tCommon("navbar.login")}
            </Link>
            <Link to="/signup" className="bd-btn bd-btn--signup">
              {tCommon("navbar.signup")}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="bd-hero">
        <img className="bd-hero-bg" src={MainBg} alt="" aria-hidden="true" />

        {/* Frame 2147237286 */}
        <div className="bd-row">
          {/* Frame 2147237285 */}
          <div className="bd-col-left">
            {/* Frame 2147237263 */}
            <div className="bd-copy">
              <div className="bd-intro">
                <span className="bd-eyebrow">{t("hero.eyebrow")}</span>
                <div className="bd-title-group">
                  <h1 className="bd-title">
                    {t("hero.titleMain")} <span>{t("hero.titleAccent")}</span>
                  </h1>
                  <p className="bd-subtitle">{t("hero.subtitle")}</p>
                </div>
              </div>

              <div className="bd-points">
                {heroPoints.map((point) => (
                  <div className="bd-point" key={point.key}>
                    <span className="bd-point-icon">
                      <img src={point.icon} alt="" aria-hidden="true" />
                    </span>
                    <span style={{ width: point.labelWidth }}>
                      {t(`hero.points.${point.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <img
              className="bd-illustration"
              src={PersonIllustration}
              alt="Illustration of a person sitting in front of analytics dashboards"
            />
          </div>

          {/* Frame 2147237284 — the white card (534 x hug811, radius10, border 1px #000 30%, pad35, gap24) */}
          <div className="bd-card">
            {/* Frame 2147237283 — 434 x hug615, gap58 */}
            <div className="bd-card-top">
              {/* Frame 2147237265 — 279.62 x hug129, gap19 */}
              <div className="bd-form-header">
                {/* Group 1000006339 — 42.46 x 41 */}
                <span className="bd-form-icon">
                  <img src={CalendarIcon} alt="" />
                </span>
                {/* Frame 2147237264 — fill279.62 x hug69, gap9 */}
                <div className="bd-form-header-text">
                  <h2>{t("form.header.title")}</h2>
                  <p>{t("form.header.subtitle")}</p>
                </div>
              </div>

              {isSubmitted ? (
                <div className="bd-success">
                  <h3>{t("success.title")}</h3>
                  <p>{t("success.text")}</p>
                </div>
              ) : (
                /* Frame 2147237282 — fill434 x hug428, gap11 */
                <form className="bd-fields" onSubmit={handleSubmit} noValidate>
                  {/* Frame 2147237272 — fill434 x hug55, gap38 */}
                  <div className="bd-field-row">
                    {/* Frame 2147237266 — fixed200.32 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-full-name">
                        {t("form.fields.fullName")} <span className="bd-required">*</span>
                      </label>
                      <div className="bd-input-wrap">
                        <img src={IconUser} alt="" aria-hidden="true" />
                        <input
                          id="bd-full-name"
                          name="fullName"
                          type="text"
                          value={form.fullName}
                          onChange={handleChange}
                          placeholder={t("form.placeholders.fullName")}
                          autoComplete="name"
                          aria-invalid={Boolean(errors.fullName)}
                        />
                      </div>
                      {errors.fullName && <span className="bd-field-error">{errors.fullName}</span>}
                    </div>

                    {/* Frame 2147237267 — fixed200.32 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-work-email">
                        {t("form.fields.workEmail")} <span className="bd-required">*</span>
                      </label>
                      <div className="bd-input-wrap">
                        <img src={IconMail} alt="" aria-hidden="true" />
                        <input
                          id="bd-work-email"
                          name="workEmail"
                          type="email"
                          value={form.workEmail}
                          onChange={handleChange}
                          placeholder={t("form.placeholders.workEmail")}
                          autoComplete="email"
                          aria-invalid={Boolean(errors.workEmail)}
                        />
                      </div>
                      {errors.workEmail && <span className="bd-field-error">{errors.workEmail}</span>}
                    </div>
                  </div>

                  {/* Frame 2147237271 — fill434 x hug55, gap38 */}
                  <div className="bd-field-row">
                    {/* Frame 2147237268 — fixed200.32 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-phone">
                        {t("form.fields.phoneNumber")} <span className="bd-required">*</span>
                      </label>
                      <div className="bd-input-wrap">
                        <img src={IconPhone} alt="" aria-hidden="true" />
                        <input
                          id="bd-phone"
                          name="phoneNumber"
                          type="tel"
                          value={form.phoneNumber}
                          onChange={handleChange}
                          placeholder={t("form.placeholders.phoneNumber")}
                          autoComplete="tel"
                          aria-invalid={Boolean(errors.phoneNumber)}
                        />
                      </div>
                      {errors.phoneNumber && <span className="bd-field-error">{errors.phoneNumber}</span>}
                    </div>

                    {/* Frame 2147237269 — fixed200.32 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-job-title">{t("form.fields.jobTitle")}</label>
                      <div className="bd-input-wrap">
                        <img src={IconJob} alt="" aria-hidden="true" />
                        <input
                          id="bd-job-title"
                          name="jobTitle"
                          type="text"
                          value={form.jobTitle}
                          onChange={handleChange}
                          placeholder={t("form.placeholders.jobTitle")}
                          autoComplete="organization-title"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frame 2147237273 — fill434 x hug55, gap3 */}
                  <div className="bd-field">
                    <label htmlFor="bd-company">
                      {t("form.fields.companyName")} <span className="bd-required">*</span>
                    </label>
                    <div className="bd-input-wrap">
                      <img src={IconCompany} alt="" aria-hidden="true" />
                      <input
                        id="bd-company"
                        name="companyName"
                        type="text"
                        value={form.companyName}
                        onChange={handleChange}
                        placeholder={t("form.placeholders.companyName")}
                        autoComplete="organization"
                        aria-invalid={Boolean(errors.companyName)}
                      />
                    </div>
                    {errors.companyName && <span className="bd-field-error">{errors.companyName}</span>}
                  </div>

                  {/* Frame 2147237274 — fill434 x hug55, gap3 */}
                  <div className="bd-field">
                    <label htmlFor="bd-hear-about">{t("form.fields.hearAboutUs")}</label>
                    <div className="bd-select-wrap">
                      <select
                        id="bd-hear-about"
                        name="hearAboutUs"
                        value={form.hearAboutUs}
                        onChange={handleChange}
                      >
                        <option value="">{t("form.placeholders.hearAboutUs")}</option>
                        {hearAboutUsOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(`form.hearAboutUsOptions.${option.key}`)}
                          </option>
                        ))}
                      </select>
                      <img src={DownArrow} alt="" aria-hidden="true" className="bd-select-chevron" />
                    </div>
                  </div>

                  {/* Frame 2147237278 — fill434 x hug55, gap38 */}
                  <div className="bd-field-row">
                    {/* Frame 2147237275 — fixed200.32 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-date">{t("form.fields.preferredDate")}</label>
                      <div className="bd-input-wrap bd-input-wrap--datetime">
                        <img src={IconDate} alt="" aria-hidden="true" />
                        <input
                          id="bd-date"
                          name="preferredDate"
                          type={isDateFocused || form.preferredDate ? "date" : "text"}
                          value={form.preferredDate}
                          onChange={handleChange}
                          onFocus={() => setIsDateFocused(true)}
                          onBlur={() => setIsDateFocused(false)}
                          placeholder={t("form.placeholders.preferredDate")}
                          readOnly={!isDateFocused && !form.preferredDate}
                        />
                      </div>
                    </div>

                    {/* Frame 2147237276 — fixed199.68 x hug55, gap3 */}
                    <div className="bd-field">
                      <label htmlFor="bd-time">{t("form.fields.preferredTime")}</label>
                      <div className="bd-input-wrap bd-input-wrap--datetime">
                        <img src={IconTime} alt="" aria-hidden="true" />
                        <input
                          id="bd-time"
                          name="preferredTime"
                          type={isTimeFocused || form.preferredTime ? "time" : "text"}
                          value={form.preferredTime}
                          onChange={handleChange}
                          onFocus={() => setIsTimeFocused(true)}
                          onBlur={() => setIsTimeFocused(false)}
                          placeholder={t("form.placeholders.preferredTime")}
                          readOnly={!isTimeFocused && !form.preferredTime}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Frame 2147237277 — fill434 x hug98, gap3 */}
                  <div className="bd-field">
                    <label htmlFor="bd-message">
                      <img src={IconPen} alt="" aria-hidden="true" className="bd-label-icon" />
                      {t("form.fields.message")}
                    </label>
                    <textarea
                      id="bd-message"
                      name="message"
                      rows="3"
                      value={form.message}
                      onChange={handleChange}
                      placeholder={t("form.placeholders.message")}
                    />
                  </div>
                </form>
              )}
            </div>

            {/* Frame 2147237281 — fixed374 x hug102, gap20:
                bd-submit-group (button + safe-note, gap11) + bd-support-note */}
            {!isSubmitted && (
              <div className="bd-actions">
                {/* Frame 2147237279 — fill374 x hug62, gap11 */}
                <div className="bd-submit-group">
                  <button
                    type="submit"
                    form={undefined}
                    onClick={handleSubmit}
                    className="bd-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("form.submitting") : t("form.submit")}
                    <span className="bd-submit-arrow" aria-hidden="true">→</span>
                  </button>

                  {/* Group 1000006356 — 351.08 x 20 */}
                  <p className="bd-safe-note">
                    <img src={IconLock} alt="" aria-hidden="true" />
                    {t("form.safeNote")}
                  </p>
                </div>

                {/* Frame 2147237280 — hug180 x 20, gap4 */}
                <p className="bd-support-note">
                  <img src={ContactSupportIcon} alt="" aria-hidden="true" />
                  {t("form.supportNote")} <a href="#contact">{t("form.supportLink")}</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER — identical markup + translation keys to the Landing Page footer,
          only the internal links are rewritten to route back to "/" since this
          is a different page. */}
      <footer className="bd-footer">
        <div className="bd-footer-container">
          <div className="bd-footer-main">
            <div className="bd-footer-brand">
              <Link to="/" className="bd-footer-brand-logo" aria-label={tCommon("brand.homeAria")}>
                <img src={FooterLogoMark} alt="" aria-hidden="true" />
                <span>{tCommon("brand.name")}</span>
              </Link>

              <p className="bd-footer-brand-description">{tCommon("footer.description")}</p>

              <div className="bd-footer-socials">
                <a href="#!" className="bd-footer-social-link" aria-label={tCommon("footer.social.x")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M18.2 3H21l-6.1 7 7.1 11h-5.6l-4.4-6.8L6 21H3.2l6.5-7.5L2.9 3h5.7l4 6.2L18.2 3Zm-1 16h1.5L7.7 4.9H6.1L17.2 19Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>

                <a href="#!" className="bd-footer-social-link" aria-label={tCommon("footer.social.linkedin")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M6.5 8.3H3.3V20h3.2V8.3ZM4.9 3A1.9 1.9 0 1 0 5 6.8 1.9 1.9 0 0 0 4.9 3ZM20.7 13.3c0-3.5-1.9-5.2-4.4-5.2-2 0-2.9 1.1-3.4 1.9V8.3H9.7V20H13v-5.8c0-1.5.3-3 2.2-3 1.8 0 1.9 1.7 1.9 3.1V20h3.2l.4-6.7Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>

                <a href="#!" className="bd-footer-social-link" aria-label={tCommon("footer.social.youtube")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M21.6 7.1a2.8 2.8 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.9 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.9ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>

                <a href="#!" className="bd-footer-social-link" aria-label={tCommon("footer.social.instagram")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="17.4" cy="6.8" r="1" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            <nav className="bd-footer-column" aria-label={tCommon("footer.aria.platform")}>
              <h3>{tCommon("footer.platform")}</h3>
              <Link to="/#features">{tCommon("footer.platformLinks.dataIntegration")}</Link>
              <Link to="/#features">{tCommon("footer.platformLinks.dataWarehouse")}</Link>
              <Link to="/#features">{tCommon("footer.platformLinks.powerBi")}</Link>
              <Link to="/#features">{tCommon("footer.platformLinks.tableau")}</Link>
              <Link to="/#features">{tCommon("footer.platformLinks.aiAnalytics")}</Link>
            </nav>

            <nav className="bd-footer-column" aria-label={tCommon("footer.aria.solutions")}>
              <h3>{tCommon("footer.solutions")}</h3>
              <Link to="/#services">{tCommon("footer.solutionLinks.sales")}</Link>
              <Link to="/#services">{tCommon("footer.solutionLinks.financial")}</Link>
              <Link to="/#services">{tCommon("footer.solutionLinks.operations")}</Link>
              <Link to="/#services">{tCommon("footer.solutionLinks.marketing")}</Link>
              <Link to="/#services">{tCommon("footer.solutionLinks.aiInsights")}</Link>
            </nav>

            <nav className="bd-footer-column" aria-label={tCommon("footer.aria.resources")}>
              <h3>{tCommon("footer.resources")}</h3>
              <a href="#!">{tCommon("footer.resourceLinks.documentation")}</a>
              <a href="#!">{tCommon("footer.resourceLinks.caseStudies")}</a>
              <a href="#!">{tCommon("footer.resourceLinks.blog")}</a>
              <a href="#!">{tCommon("footer.resourceLinks.webinars")}</a>
              <Link to="/#contact">{tCommon("footer.resourceLinks.support")}</Link>
            </nav>

            <div className="bd-footer-newsletter">
              <h3>{tCommon("footer.newsletter")}</h3>

              <p>{tCommon("footer.newsletterBlurb")}</p>

              <form className="bd-footer-newsletter-form" onSubmit={(event) => event.preventDefault()}>
                <label htmlFor="bd-footer-newsletter-email" className="sr-only">
                  {tCommon("footer.emailLabel")}
                </label>

                <input
                  id="bd-footer-newsletter-email"
                  type="email"
                  placeholder={tCommon("footer.emailPlaceholder")}
                  autoComplete="email"
                />

                <button type="submit" aria-label={tCommon("actions.subscribe")}>
                  →
                </button>
              </form>
            </div>
          </div>

          <div className="bd-footer-bottom">
            <p>{tCommon("footer.copyright", { year: new Date().getFullYear() })}</p>

            <div className="bd-footer-legal-links">
              <a href="#!">{tCommon("footer.privacy")}</a>
              <a href="#!">{tCommon("footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}