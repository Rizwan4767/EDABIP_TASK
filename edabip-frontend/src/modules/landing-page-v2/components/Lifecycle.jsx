import { useTranslation } from "react-i18next";
import { lifecycleSteps } from "../data";
import whiteArrow from "../../../assets/newlanding-page/white-arrow.svg";

export default function Lifecycle() {
  const { t } = useTranslation("landing");

  return (
    <section
      className="lv2-section lv2-lifecycle"
      id="lifecycle"
      aria-labelledby="lifecycle-title"
    >
      <div className="lv2-shell lv2-lifecycle__panel">
        <header className="lv2-section-heading">
          <span className="lv2-eyebrow">{t("lifecycle.eyebrow")}</span>
          <h2 id="lifecycle-title">{t("lifecycle.title")}</h2>
          <p>{t("lifecycle.subtitle")}</p>
        </header>

        <div className="lv2-lifecycle__grid">
          {lifecycleSteps.map((step, index) => (
            <article
              className={[
                "lv2-lifecycle-card",
                step.featured ? "lv2-lifecycle-card--featured" : "",
                step.wide ? "lv2-lifecycle-card--wide" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={step.id}
            >
              <header className="lv2-lifecycle-card__top">
                <span className="lv2-card-title">
                  <img src={step.icon} alt="" aria-hidden="true" />
                  <h3>{t(`lifecycle.steps.${step.id}.title`)}</h3>
                </span>
                <span>{t("lifecycle.phase", { number: String(index + 1).padStart(2, "0") })}</span>
              </header>
              <p>{t(`lifecycle.steps.${step.id}.text`)}</p>
              <footer>
                {step.tags?.map((tag) => (
                  <strong
                    className={`lv2-lifecycle-tag lv2-lifecycle-tag--${tag}`}
                    key={tag}
                  >
                    {t(`lifecycle.tags.${tag}`)}
                  </strong>
                ))}
                {step.action ? (
                  <a href="#modular-title">
                    {t("lifecycle.explore")}
                    <img
                      src={whiteArrow}
                      alt=""
                      aria-hidden="true"
                    />
                  </a>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
