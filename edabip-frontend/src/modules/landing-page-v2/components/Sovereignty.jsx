import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import sovereigntyVisual from "../../../assets/newlanding-page/Data-Sovereignty.svg";
import greenArrow from "../../../assets/newlanding-page/greenarrow.svg";
import whiteArrow from "../../../assets/newlanding-page/white-arrow.svg";
import { sovereigntyPillars } from "../data";

export default function Sovereignty() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="lv2-section lv2-sovereignty"
      aria-labelledby="sovereignty-title"
    >
      <div className="lv2-shell lv2-sovereignty__panel">
        <div className="lv2-sovereignty__inner">
          <div className="lv2-sovereignty__copy">
            <h2 id="sovereignty-title">
              <Trans
                t={t}
                i18nKey="sovereignty.title"
                components={{ accent: <span /> }}
              />
            </h2>

            <p>{t("sovereignty.description")}</p>

            <div className="lv2-sovereignty__actions">
              <Link className="lv2-button" to="/start-free-trial">
                {t("sovereignty.explore")}
                <img src={whiteArrow} alt="" aria-hidden="true" />
              </Link>

              <Link
                className="lv2-button lv2-button--ghost"
                to="/book-demo"
              >
                {t("sovereignty.docs")}
              </Link>
            </div>
          </div>

          <div className="lv2-sovereignty__visual">
            <img
              src={sovereigntyVisual}
              alt={t("sovereignty.visualAlt")}
              decoding="async"
            />
          </div>
        </div>

        <div className="lv2-pillars" aria-labelledby="pillars-title">
          <header className="lv2-section-heading">
            <h2 id="pillars-title">{t("pillars.title")}</h2>
            <p>{t("pillars.subtitle")}</p>
          </header>

          <div className="lv2-pillars__grid">
            {sovereigntyPillars.map((pillar) => (
              <article className="lv2-pillar-card" key={pillar.id}>
                <header>
                  <img src={pillar.icon} className="pillar-icon--idle" alt="" aria-hidden="true" />
                  <img src={pillar.iconLight} className="pillar-icon--hover" alt="" aria-hidden="true" />
                  <h3>{t(`pillars.items.${pillar.id}.title`)}</h3>
                </header>

                <p>{t(`pillars.items.${pillar.id}.text`)}</p>

                <footer>
                  <span>{t(`pillars.tags.${pillar.tag}`)}</span>

                  <a className="lv2-pillar-card__view-more" href="#contact">
                    <span>{t("pillars.learnMore")}</span>
                    <img
                      src={greenArrow}
                      alt=""
                      aria-hidden="true"
                    />
                  </a>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}