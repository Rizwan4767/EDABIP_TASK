import { useTranslation } from "react-i18next";
import footerGlobe from "../../../assets/newlanding-page/footer-globe.svg";

function MailIcon() {
  return (
    <svg viewBox="0 0 20 16" width="16" height="16" aria-hidden="true" focusable="false">
      <rect
        x="1"
        y="1"
        width="18"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m1.8 2.4 8.2 6 8.2-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}



export default function Footer() {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <footer className="lv2-footer" id="contact">
      <div className="lv2-shell">
        <div className="lv2-footer__cta">
          <div>
            <h2>{t("landing:footer.ctaTitle")}</h2>
            <p>{t("landing:footer.ctaDescription")}</p>
          </div>
          <form className="lv2-footer__subscribe" action="/start-free-trial" method="get">
            <label className="sr-only" htmlFor="lv2-newsletter-email">
              {t("landing:footer.emailLabel")}
            </label>
            <span className="lv2-footer__field">
              <MailIcon />
              <input
                id="lv2-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("landing:footer.emailPlaceholder")}
                required
              />
            </span>
            <button type="submit">{t("landing:footer.subscribe")}</button>
          </form>
        </div>

        <div className="lv2-footer__links">
          <div className="lv2-footer__brand">
            <strong>{t("common:brand.name")}</strong>
            <small>{t("landing:footer.copyright")}</small>
          </div>
          <nav aria-label={t("common:footer.aria.platform")}>
            <strong>{t("landing:footer.platform")}</strong>
            <a href="#platform-title">{t("landing:footer.platformLinks.overview")}</a>
            <a href="#modular-title">{t("landing:footer.platformLinks.modules")}</a>
            <a href="#lifecycle">{t("landing:footer.platformLinks.lifecycle")}</a>
            <a href="#sovereignty-title">{t("landing:footer.platformLinks.security")}</a>
          </nav>
          <nav aria-label={t("common:footer.aria.solutions")}>
            <strong>{t("landing:footer.solutions")}</strong>
            <a href="#modular-title">{t("landing:footer.solutionLinks.industry")}</a>
            <a href="#modular-title">{t("landing:footer.solutionLinks.function")}</a>
            <a href="#lifecycle">{t("landing:footer.solutionLinks.useCases")}</a>
            <a href="#pillars-title">{t("landing:footer.solutionLinks.aiAnalytics")}</a>
          </nav>
          <nav aria-label={t("landing:footer.connect")}>
            <strong>{t("landing:footer.connect")}</strong>
            <div className="lv2-footer__socials">
              <a
                href="https://www.edabip.com"
                aria-label={t("landing:footer.contactLinks.website")}
              >
                <img src={footerGlobe} alt="" width="16" height="16" aria-hidden="true" />
              </a>
              <a
                href="mailto:solutions@edabip.com"
                aria-label={t("landing:footer.contactLinks.email")}
              >
                <MailIcon />
              </a>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
