import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { platformStages } from "../data";
import featureIcon from "../../../assets/newlanding-page/glow-stick.svg";
import frameArrow from "../../../assets/newlanding-page/frame-arrow.svg";

const STAGE_COUNT = platformStages.length;

const getVisibleCount = () => {
  if (typeof window === "undefined") return 4;
  if (window.innerWidth <= 620) return 1;
  if (window.innerWidth <= 820) return 2;
  if (window.innerWidth <= 1180) return 3;
  return 4;
};

export default function PlatformOverview() {
  const { t } = useTranslation("landing");
  const [visibleCount, setVisibleCount] = useState(getVisibleCount);
  const [trackIndex, setTrackIndex] = useState(0);

  const maxIndex = Math.max(STAGE_COUNT - visibleCount, 0);

  useEffect(() => {
    const handleResize = () => {
      const nextVisibleCount = getVisibleCount();
      setVisibleCount(nextVisibleCount);
      setTrackIndex((current) =>
        Math.min(current, Math.max(STAGE_COUNT - nextVisibleCount, 0))
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const carouselStages = useMemo(() => platformStages, []);

  const canGoPrevious = trackIndex > 0;
  const canGoNext = trackIndex < maxIndex;

  const movePrevious = () => {
    setTrackIndex((current) => Math.max(current - 1, 0));
  };

  const moveNext = () => {
    setTrackIndex((current) => Math.min(current + 1, maxIndex));
  };

  return (
    <section className="lv2-platform" aria-labelledby="platform-title">
      <div className="lv2-shell">
        <header className="lv2-section-heading lv2-section-heading--inverse">
          <h2 id="platform-title">{t("platform.title")}</h2>
          <p>{t("platform.subtitle")}</p>
        </header>

        <div className="lv2-platform__carousel">
          {canGoPrevious && (
            <button
              className="lv2-platform__nav lv2-platform__nav--prev"
              type="button"
              onClick={movePrevious}
              aria-label={t("platform.previous")}
            >
              <img src={frameArrow} alt="" aria-hidden="true" />
            </button>
          )}

          <div className="lv2-platform__viewport">
            <div
              className="lv2-platform__track"
              style={{
                "--lv2-visible-count": visibleCount,
                transform: `translateX(calc(-${trackIndex} * ((100% - ${
                  (visibleCount - 1) * 18
                }px) / ${visibleCount} + 18px)))`,
              }}
            >
              {carouselStages.map((stage, stageIndex) => {
                const isVisible =
                  stageIndex >= trackIndex &&
                  stageIndex < trackIndex + visibleCount;

                return (
                  <article
                    className="lv2-platform__stage"
                    key={stage.id}
                    aria-hidden={!isVisible}
                  >
                    <span className="lv2-platform__number" aria-hidden="true">
                      {stageIndex + 1}
                    </span>

                    <h3>{t(`platform.stages.${stage.id}.title`)}</h3>
                    <p>{t(`platform.stages.${stage.id}.text`)}</p>

                    <div className="lv2-platform__panel">
                      <h4>
                        <img
                          src={stage.icon || featureIcon}
                          alt=""
                          aria-hidden="true"
                        />
                        {t(`platform.stages.${stage.id}.panelTitle`)}
                      </h4>

                      <ul>
                        {stage.itemKeys.map((itemKey) => (
                          <li key={itemKey}>
                            {t(`platform.stages.${stage.id}.items.${itemKey}`)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {canGoNext && (
            <button
              className="lv2-platform__nav lv2-platform__nav--next"
              type="button"
              onClick={moveNext}
              aria-label={t("platform.next")}
            >
              <img src={frameArrow} alt="" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}