import { useTranslation } from "react-i18next";
import { modules } from "../data";
import reclockIcon from "../../../assets/newlanding-page/reclock.svg";
import whiteArrow from "../../../assets/newlanding-page/white-arrow.svg";

export default function ModularEcosystem() {
  const { t } = useTranslation("landing");

  return (
    <section className="lv2-section lv2-modular" aria-labelledby="modular-title">
      <div className="lv2-shell">
        <header className="lv2-section-heading">
          <h2 id="modular-title">{t("modular.title")}</h2>
          <p>{t("modular.subtitle")}</p>
        </header>

        <div className="lv2-modular__grid">
          {modules.map((module) => {
            const title = t(`modular.items.${module.id}.title`);
            return (
              <article
                className={`lv2-module-card ${
                  module.featured ? "lv2-module-card--featured" : ""
                }`}
                key={module.id}
              >
                <header>
                  <img src={module.icon} alt="" aria-hidden="true" />
                  <h3>{title}</h3>
                </header>
                <p>{t(`modular.items.${module.id}.text`)}</p>
                {module.featured && (
                  <footer>
                    <span>{t("modular.enterpriseCore")}</span>
                    <a href="#lifecycle">
                      {t("modular.configure")}
                      <img src={whiteArrow} alt="" aria-hidden="true" />
                    </a>
                  </footer>
                )}
                {module.meta && (
                  <small>
                    <img src={reclockIcon} alt="" aria-hidden="true" />
                    {t("modular.lastGenerated")}
                  </small>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
