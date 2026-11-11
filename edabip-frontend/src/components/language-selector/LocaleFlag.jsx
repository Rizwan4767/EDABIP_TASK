/**
 * Local SVG flag marks for the language selector.
 * Locale identity comes from locale codes, not flags.
 */

import flagUs from "../../assets/landing-page/translation/US.svg";
import flagIn from "../../assets/landing-page/translation/Inda Flag.svg";
import flagJp from "../../assets/landing-page/translation/Japan.svg";
import flagKr from "../../assets/landing-page/translation/south-korea-flag-icon 1.svg";
import flagDe from "../../assets/landing-page/translation/German.svg";
import flagFr from "../../assets/landing-page/translation/French.svg";
import flagEs from "../../assets/landing-page/translation/spanish.svg";
import flagCn from "../../assets/landing-page/translation/China.svg";
import flagSa from "../../assets/landing-page/translation/Arabic.svg";
import flagIt from "../../assets/landing-page/translation/Italy.svg";

const FLAG_SOURCES = {
  us: flagUs,
  in: flagIn,
  jp: flagJp,
  kr: flagKr,
  de: flagDe,
  fr: flagFr,
  es: flagEs,
  cn: flagCn,
  sa: flagSa,
  it: flagIt,
};

export function LocaleFlag({ flagKey, className = "" }) {
  const src = FLAG_SOURCES[flagKey] || FLAG_SOURCES.us;
  return (
    <span className={`locale-flag ${className}`.trim()} aria-hidden="true">
      <img src={src} alt="" />
    </span>
  );
}
