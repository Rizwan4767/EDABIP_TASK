import "./Explore-Page.css";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../components/language-selector/LanguageSelector.jsx";

import brandLogo from "../../assets/landing-page/logo.png";

// Hero
import HeroBg from "../../assets/explore-page/hero/hero-bg.svg";
import HeroVisual from "../../assets/explore-page/hero/hero-bg2.png";
import HeroArrow from "../../assets/explore-page/hero/arrow.svg";
import HeroDateIcon from "../../assets/explore-page/hero/date-icon.svg";

// Platform Overview
import IconUnifiedDashboard from "../../assets/explore-page/platform-overview/icon-unified-dashboard.svg";
import IconRealtimeAnalytics from "../../assets/explore-page/platform-overview/icon-realtime-analytics.svg";
import IconAutomation from "../../assets/explore-page/platform-overview/icon-automation.svg";
import IconIntegrations from "../../assets/explore-page/platform-overview/icon-integrations.svg";
import IconSecurityFirst from "../../assets/explore-page/platform-overview/icon-security-first.svg";
import IconScalablePlatform from "../../assets/explore-page/platform-overview/icon-scalable-platform.svg";

// Modular Ecosystem
import IconDashboard from "../../assets/explore-page/modular-ecosystem/icon-dashboard.svg";
import IconReports from "../../assets/explore-page/modular-ecosystem/icon-reports.svg";
import IconAnalytics from "../../assets/explore-page/modular-ecosystem/icon-analytics.svg";
import IconAlerts from "../../assets/explore-page/modular-ecosystem/icon-alerts.svg";
import IconUserManagement from "../../assets/explore-page/modular-ecosystem/icon-user-management.svg";
import IconApiIntegration from "../../assets/explore-page/modular-ecosystem/icon-api-integration.svg";

// Lifecycle
import IconDataCollection from "../../assets/explore-page/lifecycle/icon-data-collection.svg";
import IconProcessData from "../../assets/explore-page/lifecycle/icon-process-data.svg";
import IconAiAnalysis from "../../assets/explore-page/lifecycle/icon-ai-analysis.svg";
import IconVisualizeInsights from "../../assets/explore-page/lifecycle/icon-visualize-insights.svg";
import IconBusinessDecisions from "../../assets/explore-page/lifecycle/icon-business-decisions.svg";

// Dashboard / Insights
import DashboardBg from "../../assets/explore-page/dashboard/dashboard-bg.svg";
import DashboardVisual from "../../assets/explore-page/dashboard/dashboard-logo.svg";
import InsightCheck from "../../assets/explore-page/dashboard/check.svg";

// Data Sovereignty
import DataSovereigntyVisual from "../../assets/explore-page/data-sovereignty/data-sovereignty-logo.svg";
import IconMfa from "../../assets/explore-page/data-sovereignty/mfa-icon.svg";
import IconEncrypt from "../../assets/explore-page/data-sovereignty/encrypt-icon.svg";
import IconRbac from "../../assets/explore-page/data-sovereignty/rbac-icon.svg";
import IconAudit from "../../assets/explore-page/data-sovereignty/audit-icon.svg";

// Performance & CTA
import IconUptime from "../../assets/explore-page/performance-scale/icon-uptime.svg";
import IconTransactions from "../../assets/explore-page/performance-scale/icon-transactions-day.svg";
import IconActiveUsers from "../../assets/explore-page/performance-scale/icon-active-users.svg";
import IconCountries from "../../assets/explore-page/performance-scale/icon-countries.svg";
import IconSupport from "../../assets/explore-page/performance-scale/icon-support.svg";
import RocketVisual from "../../assets/explore-page/performance-scale/performance-scale-rocket-logo.svg";

const PLATFORM_OVERVIEW = [
  { icon: IconUnifiedDashboard, key: "unifiedDashboard" },
  { icon: IconRealtimeAnalytics, key: "realtimeAnalytics" },
  { icon: IconAutomation, key: "automation" },
  { icon: IconIntegrations, key: "integrations" },
  { icon: IconSecurityFirst, key: "securityFirst" },
  { icon: IconScalablePlatform, key: "scalablePlatform" },
];

const MODULAR_ECOSYSTEM = [
  { icon: IconDashboard, key: "dashboard" },
  { icon: IconReports, key: "reports" },
  { icon: IconAnalytics, key: "analytics" },
  { icon: IconAlerts, key: "alerts" },
  { icon: IconUserManagement, key: "userManagement" },
  { icon: IconApiIntegration, key: "apiIntegration" },
];

const LIFECYCLE_STEPS = [
  { icon: IconDataCollection, key: "dataCollection" },
  { icon: IconProcessData, key: "processData" },
  { icon: IconAiAnalysis, key: "aiAnalysis" },
  { icon: IconVisualizeInsights, key: "visualizeInsights" },
  { icon: IconBusinessDecisions, key: "businessDecisions" },
];

const INSIGHT_POINT_KEYS = ["sync", "widgets", "builder", "export"];

const SOVEREIGNTY_CARDS = [
  { icon: IconMfa, key: "mfa" },
  { icon: IconEncrypt, key: "encryption" },
  { icon: IconRbac, key: "rbac" },
  { icon: IconAudit, key: "audit" },
];

const PERFORMANCE_STATS = [
  { icon: IconUptime, value: "99.99%", key: "uptime" },
  { icon: IconTransactions, value: "100M+", key: "actions" },
  { icon: IconActiveUsers, value: "10,000+", key: "users" },
  { icon: IconCountries, value: "50+", key: "countries" },
  { icon: IconSupport, value: "24/7", key: "support" },
];

function PublicFooter() {
  const { t } = useTranslation("common");
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer">
      <div className="landing-footer-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-brand-logo" aria-label={t("brand.homeAria")}>
              <img src={brandLogo} alt="" aria-hidden="true" />
              <span>{t("brand.name")}</span>
            </Link>

            <p className="footer-brand-description">{t("footer.description")}</p>

            <div className="footer-socials">
              <a href="#!" className="footer-social-link" aria-label={t("footer.social.x")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M18.2 3H21l-6.1 7 7.1 11h-5.6l-4.4-6.8L6 21H3.2l6.5-7.5L2.9 3h5.7l4 6.2L18.2 3Zm-1 16h1.5L7.7 4.9H6.1L17.2 19Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="#!" className="footer-social-link" aria-label={t("footer.social.linkedin")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M6.5 8.3H3.3V20h3.2V8.3ZM4.9 3A1.9 1.9 0 1 0 5 6.8 1.9 1.9 0 0 0 4.9 3ZM20.7 13.3c0-3.5-1.9-5.2-4.4-5.2-2 0-2.9 1.1-3.4 1.9V8.3H9.7V20H13v-5.8c0-1.5.3-3 2.2-3 1.8 0 1.9 1.7 1.9 3.1V20h3.2l.4-6.7Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="#!" className="footer-social-link" aria-label={t("footer.social.youtube")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M21.6 7.1a2.8 2.8 0 0 0-2-2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2 12a29 29 0 0 0 .4 4.9 2.8 2.8 0 0 0 2 2c1.8.5 7.6.5 7.6.5s5.8 0 7.6-.5a2.8 2.8 0 0 0 2-2A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.9ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
              <a href="#!" className="footer-social-link" aria-label={t("footer.social.instagram")}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect
                    x="3.5"
                    y="3.5"
                    width="17"
                    height="17"
                    rx="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="17.4" cy="6.8" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          <nav className="footer-column" aria-label={t("footer.aria.platform")}>
            <h3>{t("footer.platform")}</h3>
            <Link to="/#features">{t("footer.platformLinks.dataIntegration")}</Link>
            <Link to="/#features">{t("footer.platformLinks.dataWarehouse")}</Link>
            <Link to="/#features">{t("footer.platformLinks.powerBi")}</Link>
            <Link to="/#features">{t("footer.platformLinks.tableau")}</Link>
            <Link to="/#features">{t("footer.platformLinks.aiAnalytics")}</Link>
          </nav>

          <nav className="footer-column" aria-label={t("footer.aria.solutions")}>
            <h3>{t("footer.solutions")}</h3>
            <Link to="/#services">{t("footer.solutionLinks.sales")}</Link>
            <Link to="/#services">{t("footer.solutionLinks.financial")}</Link>
            <Link to="/#services">{t("footer.solutionLinks.operations")}</Link>
            <Link to="/#services">{t("footer.solutionLinks.marketing")}</Link>
            <Link to="/#services">{t("footer.solutionLinks.aiInsights")}</Link>
          </nav>

          <nav className="footer-column" aria-label={t("footer.aria.resources")}>
            <h3>{t("footer.resources")}</h3>
            <a href="#!">{t("footer.resourceLinks.documentation")}</a>
            <a href="#!">{t("footer.resourceLinks.caseStudies")}</a>
            <a href="#!">{t("footer.resourceLinks.blog")}</a>
            <a href="#!">{t("footer.resourceLinks.webinars")}</a>
            <Link to="/#contact">{t("footer.resourceLinks.support")}</Link>
          </nav>

          <div className="footer-newsletter">
            <h3>{t("footer.newsletter")}</h3>
            <p>{t("footer.newsletterBlurb")}</p>
            <form
              className="footer-newsletter-form"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="explore-footer-newsletter-email" className="sr-only">
                {t("footer.emailLabel")}
              </label>
              <input
                id="explore-footer-newsletter-email"
                type="email"
                placeholder={t("footer.emailPlaceholder")}
                autoComplete="email"
              />
              <button type="submit" aria-label={t("actions.subscribe")}>
                →
              </button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p>{t("footer.copyright", { year })}</p>
          <div className="footer-legal-links">
            <a href="#!">{t("footer.privacy")}</a>
            <a href="#!">{t("footer.terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function ExplorePage() {
  const { t } = useTranslation(["explore", "common"]);

  return (
    <main className="explore-page">
      <header className="explore-header">
        <div className="explore-header-container">
          <Link to="/" className="explore-brand" aria-label={t("common:brand.homeAria")}>
            <img
              className="explore-brand-logo"
              src={brandLogo}
              alt=""
              aria-hidden="true"
            />
            <span>{t("common:brand.name")}</span>
          </Link>

          <div className="explore-header-actions">
            <Link to="/login" className="explore-login-button">
              {t("common:navbar.login")}
            </Link>
            <Link to="/signup" className="explore-signup-button">
              {t("common:navbar.signup")}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <section className="explore-hero" aria-labelledby="explore-hero-heading">
        <img
          className="explore-hero-bg"
          src={HeroBg}
          alt=""
          aria-hidden="true"
        />
        <div className="explore-hero-inner">
          <div className="explore-hero-copy">
            <nav className="explore-hero-breadcrumb" aria-label="Breadcrumb">
              <Link to="/">{t("hero.breadcrumbHome")}</Link>
              <span aria-hidden="true">›</span>
              <span>{t("hero.breadcrumbCurrent")}</span>
            </nav>
            <h1 id="explore-hero-heading">
              {t("hero.titleBefore")} <span>{t("hero.titleBrand")}</span>{" "}
              {t("hero.titleAfter")}
            </h1>
            <p className="explore-hero-text">{t("hero.description")}</p>
            <div className="explore-hero-actions">
              <Link to="/start-free-trial" className="explore-btn explore-btn--primary explore-hero-btn">
                {t("hero.startTrial")}
                <img src={HeroArrow} alt="" aria-hidden="true" />
              </Link>

              <Link
               to="/book-demo"
               className="explore-btn explore-btn--secondary explore-hero-btn"
              >
                {t("hero.bookDemo")}
                <img src={HeroDateIcon} alt="" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="explore-hero-visual">
            <img src={HeroVisual} alt={t("hero.visualAlt")} />
          </div>
        </div>
      </section>

      <section className="explore-section explore-overview" aria-labelledby="overview-heading">
        <div className="explore-section-inner explore-section-inner--wide">
          <header className="explore-section-header">
            <h2 id="overview-heading">{t("overview.title")}</h2>
            <p>{t("overview.subtitle")}</p>
          </header>
          <div className="explore-overview-grid">
            {PLATFORM_OVERVIEW.map((item) => (
              <article key={item.key} className="explore-overview-card">
                <div className="explore-overview-icon">
                  <img src={item.icon} alt="" aria-hidden="true" />
                </div>
                <h3>{t(`overview.items.${item.key}.title`)}</h3>
                <p>{t(`overview.items.${item.key}.description`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="explore-section explore-modular"
        id="modular-ecosystem"
        aria-labelledby="modular-heading"
      >
        <div className="explore-section-inner">
          <header className="explore-section-header">
            <h2 id="modular-heading">{t("modular.title")}</h2>
            <p>{t("modular.subtitle")}</p>
          </header>
          <div className="explore-modular-grid">
            {MODULAR_ECOSYSTEM.map((item) => (
              <article key={item.key} className="explore-modular-card">
                <div className="explore-modular-icon">
                  <img src={item.icon} alt="" aria-hidden="true" />
                </div>
                <h3>{t(`modular.items.${item.key}.title`)}</h3>
                <p>{t(`modular.items.${item.key}.description`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-section explore-lifecycle" aria-labelledby="lifecycle-heading">
        <div className="explore-section-inner">
          <header className="explore-section-header">
            <h2 id="lifecycle-heading">{t("lifecycle.title")}</h2>
            <p>{t("lifecycle.subtitle")}</p>
          </header>
          <div className="explore-lifecycle-track">
            {LIFECYCLE_STEPS.map((step) => (
              <article key={step.key} className="explore-lifecycle-card">
                <div className="explore-lifecycle-icon">
                  <img src={step.icon} alt="" aria-hidden="true" />
                </div>
                <h3>{t(`lifecycle.steps.${step.key}.title`)}</h3>
                <p>{t(`lifecycle.steps.${step.key}.description`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-section explore-insights" aria-labelledby="insights-heading">
        <img
          className="explore-insights-bg"
          src={DashboardBg}
          alt=""
          aria-hidden="true"
        />
        <div className="explore-section-inner explore-insights-inner">
          <div className="explore-insights-copy">
            <span className="explore-insights-badge">{t("insights.badge")}</span>
            <h2 id="insights-heading">{t("insights.title")}</h2>
            <p className="explore-insights-lead">{t("insights.lead")}</p>
            <ul className="explore-insights-list">
              {INSIGHT_POINT_KEYS.map((key) => (
                <li key={key}>
                  <img
                    className="explore-insights-check"
                    src={InsightCheck}
                    alt=""
                    aria-hidden="true"
                  />
                  <span>{t(`insights.points.${key}`)}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="explore-insights-cta">
              {t("insights.cta")}
              <img src={HeroArrow} alt="" aria-hidden="true" />
            </Link>
          </div>
          <div className="explore-insights-visual">
            <img
              className="explore-insights-main"
              src={DashboardVisual}
              alt={t("insights.visualAlt")}
            />
          </div>
        </div>
      </section>

      <section className="explore-section explore-sovereignty" aria-labelledby="sovereignty-heading">
        <div className="explore-section-inner explore-sovereignty-inner">
          <div className="explore-sovereignty-visual">
            <img
              src={DataSovereigntyVisual}
              alt={t("sovereignty.visualAlt")}
            />
          </div>
          <div className="explore-sovereignty-content">
            <p className="explore-sovereignty-eyebrow">{t("sovereignty.eyebrow")}</p>
            <h2 id="sovereignty-heading">{t("sovereignty.title")}</h2>
            <div className="explore-sovereignty-grid">
              {SOVEREIGNTY_CARDS.map((card) => (
                <article key={card.key} className="explore-sovereignty-card">
                  <div className="explore-sovereignty-card-icon">
                    <img src={card.icon} alt="" aria-hidden="true" />
                  </div>
                  <h3>{t(`sovereignty.cards.${card.key}.title`)}</h3>
                  <p>{t(`sovereignty.cards.${card.key}.description`)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="explore-section explore-performance" aria-labelledby="performance-heading">
        <div className="explore-section-inner">
          <header className="explore-section-header">
            <h2 id="performance-heading">{t("performance.title")}</h2>
            <p>{t("performance.subtitle")}</p>
          </header>
          <div className="explore-performance-grid">
            {PERFORMANCE_STATS.map((stat) => (
              <article key={stat.key} className="explore-performance-card">
                <div className="explore-performance-icon">
                  <img src={stat.icon} alt="" aria-hidden="true" />
                </div>
                <span>{t(`performance.stats.${stat.key}`)}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="explore-cta-section" aria-labelledby="cta-heading">
        <div className="explore-cta-banner">
          <img
            className="explore-cta-rocket"
            src={RocketVisual}
            alt=""
            aria-hidden="true"
          />
          <div className="explore-cta-copy">
            <h2 id="cta-heading">{t("cta.title")}</h2>
            <p>{t("cta.description")}</p>
          </div>
          <Link to="/signup" className="explore-btn explore-btn--light">
            {t("cta.button")}
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
