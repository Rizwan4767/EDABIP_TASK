import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLayoutEffect, useRef, useState, useId } from 'react';
import Logo from '../../../assets/dashboard/Sidebar/logo.svg';
import NavbarLogo from '../../../assets/newlanding-page/logo.svg';
import LogoPot from '../../../assets/dashboard/Sidebar/logo-pot-right.svg';
import DashboardIcon from '../../../assets/dashboard/Sidebar/dashboard-icon.svg';
import PowerBiIcon from '../../../assets/dashboard/Sidebar/powerbi.svg';
import TableauIcon from '../../../assets/dashboard/Sidebar/tableau.svg';
import AnalyticsIcon from '../../../assets/dashboard/Sidebar/analytics.svg';
import ReportIcon from '../../../assets/dashboard/Sidebar/report.svg';
import BillingIcon from '../../../assets/dashboard/Sidebar/billing.svg';
import UsersIcon from '../../../assets/dashboard/Sidebar/users.svg';
import SettingsIcon from '../../../assets/dashboard/Sidebar/settings.svg';
import LogoutIcon from '../../../assets/dashboard/Sidebar/logout.svg';
import AiChatbot from '../../../assets/dashboard/Sidebar/ai-chatbot.svg';
import { useAIAssistant } from '../../aiAssistant/index.js';
import  LogoutModal  from '../../logoutmodal/LogoutModal.jsx';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
  { id: 'powerbi', label: 'Power BI', icon: PowerBiIcon, path: '/powerbi' },
  { id: 'tableau', label: 'Tableau', icon: TableauIcon, path: '/tableau' },
  { id: 'analytics', label: 'Analytics', icon: AnalyticsIcon, path: '/analytics' },
  { id: 'report', label: 'Report', icon: ReportIcon, path: '/reports' },
  { id: 'billing', label: 'Billing', icon: BillingIcon, path: '/billing' },
  { id: 'users', label: 'Users', icon: UsersIcon, path: '/users' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' },
];

const COLLAPSED_STORAGE_KEY = 'edabip.sidebar.collapsed';

function readCollapsedPreference() {
  try {
    return window.sessionStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistCollapsedPreference(collapsed) {
  try {
    window.sessionStorage.setItem(COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    /* private mode / quota */
  }
}

function isItemActive(item, pathname) {
  return (
    pathname === item.path ||
    pathname.startsWith(`${item.path}/`) ||
    (item.extraPaths || []).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  );
}

function SidebarTooltip({ children, placement = 'right' }) {
  return (
    <span
      className={`db-sidebar__tooltip${placement === 'below' ? ' db-sidebar__tooltip--below' : ''}`}
      role="tooltip"
    >
      {children}
    </span>
  );
}

function DashboardSidebar({ onLogout }) {
  const { openAssistant } = useAIAssistant();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const aiPanelRef = useRef(null);
  const logoutTitleId = useId();

  useLayoutEffect(() => {
    const panel = aiPanelRef.current;
    if (!panel) return;
    if (collapsed) {
      panel.setAttribute('inert', '');
    } else {
      panel.removeAttribute('inert');
    }
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      persistCollapsedPreference(next);
      return next;
    });
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  return (
    <>
      <aside
        id="dashboard-sidebar"
        className={`db-sidebar${collapsed ? ' db-sidebar--collapsed' : ''}`}
      >
        <div className="db-sidebar__brand">
          <span className="db-sidebar__logo-slot" aria-hidden="true" />
          <button
            type="button"
            className="db-sidebar__collapse"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar"
            aria-label={collapsed ? 'Open sidebar' : 'Collapse sidebar'}
          >
            <img src={LogoPot} alt="" width="18" height="18" />
            <SidebarTooltip placement="below">
              {collapsed ? 'Open sidebar' : 'Collapse sidebar'}
            </SidebarTooltip>
          </button>
        </div>

        <nav className="db-sidebar__nav" aria-label="Main">
          {NAV_ITEMS.map((item) =>
            item.path ? (
              <NavLink
                key={item.id}
                to={item.path}
                className={() => {
                  const active = isItemActive(item, location.pathname);
                  return `db-sidebar__link${active ? ' db-sidebar__link--active' : ''}`;
                }}
              >
                <span className="db-sidebar__link-icon">
                  <img src={item.icon} alt="" width="20" height="20" />
                </span>
                <span className="db-sidebar__link-label">{item.label}</span>
                {collapsed ? <SidebarTooltip>{item.label}</SidebarTooltip> : null}
              </NavLink>
            ) : (
              <button
                key={item.id}
                type="button"
                className="db-sidebar__link"
              >
                <span className="db-sidebar__link-icon">
                  <img src={item.icon} alt="" width="20" height="20" />
                </span>
                <span className="db-sidebar__link-label">{item.label}</span>
                {collapsed ? <SidebarTooltip>{item.label}</SidebarTooltip> : null}
              </button>
            )
          )}

          <button
            type="button"
            className="db-sidebar__link"
            onClick={handleLogoutClick}
          >
            <span className="db-sidebar__link-icon">
              <img src={LogoutIcon} alt="" width="20" height="20" />
            </span>
            <span className="db-sidebar__link-label">Logout</span>
            {collapsed ? <SidebarTooltip>Logout</SidebarTooltip> : null}
          </button>
        </nav>

        <div className="db-sidebar__ai" ref={aiPanelRef} aria-hidden={collapsed}>
          <div className="db-sidebar__ai-top">
            <img src={AiChatbot} alt="" className="db-sidebar__ai-icon" />
            <div className="db-sidebar__ai-copy">
              <p className="db-sidebar__ai-title">AI Assistant</p>
              <p className="db-sidebar__ai-sub">Your Intelligent Companion</p>
            </div>
          </div>
          <button
            type="button"
            className="db-sidebar__ai-btn"
            onClick={openAssistant}
            aria-label="Ask AI Assistant"
          >
            Ask AI
          </button>
        </div>
      </aside>

      <button
        type="button"
        className={`db-brand-logo${collapsed ? ' db-brand-logo--navbar' : ''}`}
        onClick={() => navigate('/dashboard')}
        aria-label="Go to login"
      >
        <img
          src={Logo}
          alt={collapsed ? '' : 'EDABIP'}
          aria-hidden={collapsed}
          className="db-brand-logo__on-sidebar"
        />
        <img
          src={NavbarLogo}
          alt={collapsed ? 'EDABIP' : ''}
          aria-hidden={!collapsed}
          className="db-brand-logo__on-navbar"
        />
      </button>

      <LogoutModal
        isOpen={showLogoutModal}
        titleId={logoutTitleId}
        title="Logout"
        message="Are you sure you want to log out?"
        noteTitle="You will be logged out of your account"
        noteBody="You will need to sign in again to access your account and dashboard."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}

export default DashboardSidebar;