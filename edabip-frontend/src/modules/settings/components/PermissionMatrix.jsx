import DashboardIcon from '../../../assets/dashboard/settings/matrix/icon-dashboard.svg';
import PowerBiIcon from '../../../assets/dashboard/settings/matrix/icon-powerbi.svg';
import TableauIcon from '../../../assets/dashboard/settings/matrix/icon-tableau.svg';
import AnalyticsIcon from '../../../assets/dashboard/settings/matrix/icon-analytics.svg';
import ReportIcon from '../../../assets/dashboard/settings/matrix/icon-reports.svg';
import BillingIcon from '../../../assets/dashboard/settings/matrix/icon-billing.svg';
import UsersIcon from '../../../assets/dashboard/settings/matrix/icon-users.svg';
import SettingsIcon from '../../../assets/dashboard/settings/matrix/icon-settings.svg';
import CheckIcon from '../../../assets/dashboard/settings/matrix/check.svg';
import CloseIcon from '../../../assets/dashboard/settings/matrix/close.svg';
import { VIEW_ONLY, PERMISSION_MODULES } from '../data/permissionMatrix.js';

const MODULE_ICONS = {
  dashboard: { src: DashboardIcon, framed: false },
  powerbi: { src: PowerBiIcon, framed: false },
  tableau: { src: TableauIcon, framed: false },
  analytics: { src: AnalyticsIcon, framed: false },
  reports: { src: ReportIcon, framed: false },
  billing: { src: BillingIcon, framed: true },
  users: { src: UsersIcon, framed: true },
  settings: { src: SettingsIcon, framed: false },
};

function formatUserCount(count) {
  const value = Number.isFinite(count) ? count : 0;
  return `${value} ${value === 1 ? 'User' : 'Users'}`;
}

function RolePermissionCard({ role, value }) {
  const hasAccess = value !== VIEW_ONLY;
  const statusLabel = hasAccess
    ? `${role.name} has full access`
    : `${role.name} is view only`;

  return (
    <article className="st-matrix-card">
      <div className="st-matrix-card__head">
        <h5>{role.name}</h5>
        <span className="st-matrix-status" role="img" aria-label={statusLabel}>
          <img src={hasAccess ? CheckIcon : CloseIcon} alt="" width="18" height="18" />
        </span>
      </div>
      <div className="st-matrix-card__meta">
        <span className="st-matrix-badge st-matrix-badge--users">
          {formatUserCount(role.userCount)}
        </span>
        {hasAccess ? null : (
          <span className="st-matrix-badge st-matrix-badge--view">View Only</span>
        )}
      </div>
    </article>
  );
}

function PermissionMatrix({ roles, matrix }) {
  if (roles.length === 0) {
    return <p className="st-table__empty">No roles available.</p>;
  }

  return (
    <div className="st-matrix-board">
      {PERMISSION_MODULES.map((module) => {
        const icon = MODULE_ICONS[module.id];
        return (
          <section
            key={module.id}
            className="st-matrix-module"
            aria-labelledby={`st-matrix-${module.id}`}
          >
            <header className="st-matrix-module__head">
              <span
                className={`st-matrix-module__icon${icon.framed ? ' is-framed' : ''}`}
                aria-hidden="true"
              >
                <img
                  src={icon.src}
                  alt=""
                  width={icon.framed ? 16 : 40}
                  height={icon.framed ? 16 : 40}
                />
              </span>
              <h3 id={`st-matrix-${module.id}`}>{module.label}</h3>
            </header>

            {module.actions.map((action, index) => (
              <div key={action.id} className="st-matrix-action">
                {index > 0 ? <hr className="st-matrix-rule" /> : null}
                <h4>{action.label}</h4>
                <p>{action.description}</p>
                <div className="st-matrix-grid">
                  {roles.map((role) => (
                    <RolePermissionCard
                      key={`${role.id}-${module.id}-${action.id}`}
                      role={role}
                      value={matrix[role.id]?.[module.id]?.[action.id]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

export default PermissionMatrix;
