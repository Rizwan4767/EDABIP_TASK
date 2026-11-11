import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LOCALES,
  getLocaleConfig,
  normalizeLocale,
} from "../../i18n/localeConfig.js";
import { updateLocalePreference } from "../../i18n/localePreferenceService.js";
import { LocaleFlag } from "./LocaleFlag.jsx";
import "./LanguageSelector.css";

function GlobeIcon() {
  return (
    <svg
      className="language-selector__globe"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.5 12h17M12 3c2.8 2.4 4.2 5.5 4.2 9s-1.4 6.6-4.2 9c-2.8-2.4-4.2-5.5-4.2-9S9.2 5.4 12 3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`language-selector__chevron ${open ? "is-open" : ""}`}
      viewBox="0 0 12 8"
      width="10"
      height="7"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 1.5 6 6.5 11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="language-selector__check"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.2 8.2 6.4 11.4 12.8 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Reusable language selector for public and authenticated shells.
 * Preference persistence goes through localePreferenceService — never inline.
 */
export default function LanguageSelector({
  className = "",
  authenticated = false,
}) {
  const { t, i18n } = useTranslation("common");
  const listboxId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const optionRefs = useRef([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pending, setPending] = useState(false);

  const current = getLocaleConfig(i18n.language);
  const enabledLocales = useMemo(
    () => SUPPORTED_LOCALES.filter((locale) => locale.enabled),
    [],
  );

  useEffect(() => {
    const index = enabledLocales.findIndex((locale) => locale.code === current.code);
    setActiveIndex(index >= 0 ? index : 0);
  }, [current.code, open, enabledLocales]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  const closeMenu = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) {
      triggerRef.current?.focus();
    }
  };

  const selectLocale = async (localeCode) => {
    const next = normalizeLocale(localeCode);
    if (next === current.code || pending) {
      closeMenu();
      return;
    }

    const previous = current.code;
    setPending(true);

    try {
      // Optimistic UI update for snappy switching.
      await i18n.changeLanguage(next);
      await updateLocalePreference(next, { authenticated });
      closeMenu();
    } catch {
      await i18n.changeLanguage(previous);
      // Toast integration lands with auth phase; keep console for mock mode.
      if (import.meta.env.DEV) {
        console.warn("[i18n] Locale preference update failed; rolled back.");
      }
      closeMenu();
    } finally {
      setPending(false);
    }
  };

  const onTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onOptionKeyDown = (event, index) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index + 1) % enabledLocales.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index - 1 + enabledLocales.length) % enabledLocales.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(enabledLocales.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void selectLocale(enabledLocales[index].code);
    }
  };

  return (
    <div
      className={`language-selector ${className}`.trim()}
      ref={rootRef}
    >
      <button
        type="button"
        ref={triggerRef}
        className="language-selector__trigger"
        aria-label={t("language.selectorAria", { code: current.short })}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        disabled={pending}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onTriggerKeyDown}
      >
        <GlobeIcon />
        <span className="language-selector__code">{current.short}</span>
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="language-selector__dropdown" role="presentation">
          <ul
            id={listboxId}
            className="language-selector__list"
            role="listbox"
            aria-label={t("language.menuLabel")}
            tabIndex={-1}
          >
            {enabledLocales.map((locale, index) => {
              const selected = locale.code === current.code;
              return (
                <li key={locale.code} role="presentation">
                  <button
                    type="button"
                    role="option"
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    className={`language-selector__option ${
                      selected ? "is-selected" : ""
                    } ${index === activeIndex ? "is-active" : ""}`}
                    aria-selected={selected}
                    tabIndex={index === activeIndex ? 0 : -1}
                    onMouseEnter={() => setActiveIndex(index)}
                    onKeyDown={(event) => onOptionKeyDown(event, index)}
                    onClick={() => {
                      void selectLocale(locale.code);
                    }}
                  >
                    <LocaleFlag flagKey={locale.flagKey} />
                    <span className="language-selector__labels">
                      <span className="language-selector__primary">
                        {t("language.optionLabel", {
                          label: locale.label,
                          short: locale.short,
                        })}
                      </span>
                      <span
                        className="language-selector__native"
                        lang={locale.code}
                        dir={locale.direction}
                      >
                        {locale.nativeLabel}
                      </span>
                    </span>
                    {selected ? (
                      <span className="language-selector__selected-mark">
                        <span className="sr-only">{t("language.selected")}</span>
                        <CheckIcon />
                      </span>
                    ) : (
                      <span className="language-selector__selected-mark" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
