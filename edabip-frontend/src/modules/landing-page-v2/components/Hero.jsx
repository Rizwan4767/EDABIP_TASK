import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import heroPlatform from "../../../assets/newlanding-page/herobg.svg";
import heroWave from "../../../assets/newlanding-page/right-bg.svg";
import kpiIcon from "../../../assets/newlanding-page/realtime.svg";
import clockIcon from "../../../assets/newlanding-page/clock.svg";
import shieldIcon from "../../../assets/newlanding-page/shield.svg";

const proofIcons = [kpiIcon, clockIcon, shieldIcon];

export default function Hero() {
  const { t } = useTranslation("landing");

  return (
    <section className="lv2-hero" aria-labelledby="landing-title">
      <img className="lv2-hero__wave" src={heroWave} alt="" aria-hidden="true" />
      <div className="lv2-shell lv2-hero__inner">
        <div className="lv2-hero__copy">
          <div className="lv2-hero__pills" aria-label={t("hero.eyebrow")}>
            <span>{t("hero.pills.data")}</span>
            <span>{t("hero.pills.ai")}</span>
            <span>{t("hero.pills.visualization")}</span>
          </div>
          <h1 id="landing-title">
            <Trans
              t={t}
              i18nKey="hero.title"
              components={{ accent: <span />, br: <br /> }}
            />
          </h1>
          <p>
            <Trans
              t={t}
              i18nKey="hero.description"
              components={{
                br: <br />,
              }}
            />
          </p>
          
          <div className="lv2-hero__actions">
            <Link className="lv2-button lv2-button--ghost" to="/book-demo">
              {t("hero.requestDemo")}
            </Link>
            <Link className="lv2-button" to="/signup">
              {t("hero.getStarted")}
            </Link>
          </div>
          <ul className="lv2-hero__proof" aria-label={t("hero.proofAria")}>
            {["monitoring", "processing", "security"].map((key, index) => (
              <li key={key}>
                <img src={proofIcons[index]} alt="" aria-hidden="true" />
                {t(`hero.proof.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="lv2-hero__visual">
          <img
            src={heroPlatform}
            alt={t("hero.visualAlt")}
          />
        </div>
      </div>
    </section>
  );
}
