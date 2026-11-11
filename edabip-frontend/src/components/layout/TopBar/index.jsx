import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BILLING_PLANS_HASH } from "../../../modules/billing/utils/constants.js";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { getWelcomeDisplayName } from "../../../modules/auth/utils/getWelcomeDisplayName.js";
import ProfileAvatar from "../../common/ProfileAvatar/index.jsx";
import ProfileDetailsModal from "../../../modules/user-management/components/ProfileDetailsModal.jsx";
import SearchIcon from "../../../assets/dashboard/search.svg";
import SearchClear from "../../../assets/dashboard/charts/search-clear.svg";
import NotificationsIcon from "../../../assets/dashboard/notifications.svg";
import AvatarMark from "../../../assets/dashboard/charts/avatar.svg";
import PersonIcon from "../../../assets/dashboard/account-menu/person.svg";
import SettingsIcon from "../../../assets/dashboard/account-menu/settings.svg";
import PaymentHistoryIcon from "../../../assets/dashboard/account-menu/payment-history.png";
import LogoutIcon from "../../../assets/dashboard/account-menu/logout.svg";
import ChevronRight from "../../../assets/dashboard/account-menu/chevron-right.svg";
import "./TopBar.css";

/**
 * Shared dashboard header (search, notifications, account menu) used by
 * every dashboard-shell page. Self-contained: it owns its own search text
 * and reads/writes auth state directly, so pages only need `<TopBar />`.
 */
function TopBar({ placeholder = "Search" }) {
  const { user, profilePictureUrl, logout } = useAuthContext();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const menuRootRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (showProfileModal) return;
      if (menuRootRef.current && !menuRootRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen, showProfileModal]);

  const displayName = getWelcomeDisplayName(user);

  function goToMyProfile() {
    setShowProfileModal(true);
  }

  function goToSettings() {
    setMenuOpen(false);
    navigate("/settings");
  }

  function goToPaymentHistory() {
    setMenuOpen(false);
    navigate("/payment-history");
  }

  function goToUpgradePlan(event) {
    setMenuOpen(false);
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(`/billing${BILLING_PLANS_HASH}`, {
      state: { scrollToPlans: Date.now() },
    });
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  return (
    <header className="db-topbar">
      <div className="db-search">
        <img src={SearchIcon} alt="" className="db-search__icon" width="14" height="14" />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={placeholder}
        />
        {query ? (
          <button
            type="button"
            className="db-search__clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <img src={SearchClear} alt="" width="14" height="14" />
          </button>
        ) : (
          <img src={SearchClear} alt="" className="db-search__clear-icon" width="14" height="14" />
        )}
      </div>

      <div className="db-topbar__actions">
        <button type="button" className="db-topbar__bell" aria-label="Notifications">
          <img src={NotificationsIcon} alt="" width="24" height="24" />
        </button>

        <div className="tb-account" ref={menuRootRef}>
          <button
            type="button"
            className="db-topbar__avatar tb-account__trigger"
            aria-label="Open account menu"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <img
              src={profilePictureUrl || AvatarMark}
              alt=""
              className={profilePictureUrl ? "db-topbar__avatar-photo" : undefined}
            />
          </button>

          {menuOpen && (
            <dialog open className="tb-account__menu" aria-label="Account menu">
              <div className="tb-account__header">
                <ProfileAvatar pictureUrl={profilePictureUrl} size={70} />
                <div className="tb-account__identity">
                  <p className="tb-account__name">{displayName}</p>
                  <p className="tb-account__email">{user?.email}</p>
                  <Link
                    to={`/billing${BILLING_PLANS_HASH}`}
                    className="tb-account__upgrade"
                    onClick={goToUpgradePlan}
                  >
                    Upgrade Your Plan
                  </Link>
                </div>
              </div>

              <div className="tb-account__divider" />

              <button type="button" className="tb-account__item" onClick={goToMyProfile}>
                <img src={PersonIcon} alt="" width="16" height="18" />
                <span className="tb-account__item-label">My Profile</span>
                <img src={ChevronRight} alt="" className="tb-account__chevron" width="8" height="14" />
              </button>

              <button type="button" className="tb-account__item" onClick={goToSettings}>
                <img src={SettingsIcon} alt="" width="16" height="18" />
                <span className="tb-account__item-label">Settings</span>
                <img src={ChevronRight} alt="" className="tb-account__chevron" width="8" height="14" />
              </button>

              <div className="tb-account__item tb-account__item--static">
                <img src={NotificationsIcon} alt="" width="16" height="18" />
                <span className="tb-account__item-label">Notification</span>
                <span className="tb-account__notification-status">Allow</span>
              </div>

              <button type="button" className="tb-account__item" onClick={goToPaymentHistory}>
                <img src={PaymentHistoryIcon} alt="" width="16" height="16" />
                <span className="tb-account__item-label">Payment History</span>
                <img src={ChevronRight} alt="" className="tb-account__chevron" width="8" height="14" />
              </button>

              <button
                type="button"
                className="tb-account__item"
                onClick={handleLogout}
              >
                <img src={LogoutIcon} alt="" width="16" height="18" />
                <span className="tb-account__item-label">Log Out</span>
              </button>
            </dialog>
          )}
        </div>
      </div>

      <ProfileDetailsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
}

export default TopBar;
