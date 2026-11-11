
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import { isMockAuthEnabled } from '../../auth/utils/mockSession.js';
import { updateProfile } from '../../auth/api/authApi.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';

import '../../dashboard/pages/DashboardPage.css';
import './SettingsPage.css';
import { useSettings } from '../hooks/useSettings.js';
import GeneralSettingsForm from '../components/GeneralSettingsForm.jsx';
import NotificationPreferences from '../components/NotificationPreferences.jsx';
import IntegrationsTable from '../components/IntegrationsTable.jsx';
import SecuritySettings from '../components/SecuritySettings.jsx';
import RoleManagement from '../components/RoleManagement.jsx';
import SettingsPageSkeleton from '../components/SettingsPageSkeleton.jsx';
import AppFooter from '../../../components/common/AppFooter/index.jsx';

function SettingsPage() {
  const { logout, user, updateUser } = useAuthContext();
  const navigate = useNavigate();
  const {
    data,
    loading,
    error,
    reload,
    updateGeneral,
    updateNotifications,
    updateSecurity,
    updatePassword,
    updateIntegration,
  } = useSettings(user);

    const displayName = getWelcomeDisplayName(user);

  
  // Settings' General Settings form only saves into its own store; push
  // every field to the backend (PATCH /auth/me) so it survives a
  // different browser/device. The AuthContext update (updateUser) is what
  // makes Settings reload and show its skeleton — delaying it slightly
  // lets the "General settings saved." message show first instead of
  // being unmounted the instant it appears.
  const handleSaveGeneral = async (payload) => {
    const saved = await updateGeneral(payload);

    let applyToAuthContext;

    if (isMockAuthEnabled) {
      applyToAuthContext = () =>
        updateUser({
          fullName: `${saved.firstName} ${saved.lastName}`.trim(),
          email: saved.email,
          mobileNumber: saved.mobileNumber,
          applicationName: saved.applicationName,
          timezone: saved.timezone,
          companySize: saved.companySize,
          industry: saved.industry,
          emailNotifications: saved.emailNotifications,
        });
    } else {
      const backendUser = await updateProfile({
        firstName: saved.firstName,
        lastName: saved.lastName,
        mobileNumber: saved.mobileNumber,
        applicationName: saved.applicationName,
        timezone: saved.timezone,
        companySize: saved.companySize,
        industry: saved.industry,
        emailNotifications: saved.emailNotifications,
      });
      applyToAuthContext = () => updateUser(backendUser);
    }

    // Let the success message render before the reload kicks in.
    setTimeout(applyToAuthContext, 1200);

    return saved;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="db-page st-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content st-content">
          <div className="st-page-head">
            <h1>Settings</h1>
          </div>

          <section className="st-welcome" aria-label="Welcome">
            <div className="st-welcome__title-row">
              <h2>Welcome Back, {displayName}!</h2>
              <span className="db-realtime">
                <span className="db-realtime__dot" />
                <span>Real Time</span>
              </span>
            </div>
            <p>
              Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key
              Metrics.
            </p>
          </section>

          {error ? (
            <div className="st-error" role="alert">
              <p>{error}</p>
              <button type="button" className="db-btn db-btn--solid" onClick={reload}>
                Retry
              </button>
            </div>
          ) : null}

          {loading ? <SettingsPageSkeleton /> : null}

          {!loading && !error ? (
            <>
              {data.general ? (
                <GeneralSettingsForm
                  value={data.general}
                  options={data.options}
                  onSave={handleSaveGeneral}
                />
              ) : null}
              {data.notifications ? (
                <NotificationPreferences
                  value={data.notifications}
                  options={data.options}
                  onSave={updateNotifications}
                />
              ) : null}
              <div className="st-split">
                <IntegrationsTable
                  integrations={data.integrations}
                  onToggle={updateIntegration}
                />
                {data.security ? (
                  <SecuritySettings
                    value={data.security}
                    onSave={updateSecurity}
                    onChangePassword={updatePassword}
                  />
                ) : null}
              </div>
              {/*
                GET /settings/me includes `roles` for every signed-in user.
                An empty list means the catalog has not been seeded yet.
                Rendering the section anyway would show an empty Roles
                Overview and a Permission Matrix with no rows.
              */}
              {data.roles?.length ? (
                <RoleManagement roles={data.roles} />
              ) : null}
            </>
          ) : null}
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
