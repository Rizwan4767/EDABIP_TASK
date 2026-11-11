import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../../../components/language-selector/LanguageSelector.jsx";
import logo from "../../../assets/newlanding-page/logo.svg";

export default function Header() {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <header className="lv2-header">
      <div className="lv2-shell lv2-header__inner">
        <Link className="lv2-brand" to="/" aria-label={t("common:brand.homeAria")}>
          <img className="lv2-brand-logo" src={logo} alt={t("common:brand.name")} />
        </Link>

        <nav className="lv2-header__actions" aria-label={t("common:navbar.mainNav")}>
          <Link className="lv2-button lv2-button--compact" to="/login">
            {t("landing:Login")}
          </Link>
          <LanguageSelector />
        </nav>
      </div>
    </header>
  );
}
