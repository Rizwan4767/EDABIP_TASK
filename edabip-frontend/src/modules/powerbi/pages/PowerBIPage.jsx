import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './PowerBIPage.css';
import { getPowerBIReports } from '../api/powerbiApi.js';
import PowerBIPageSkeleton from '../components/PowerBIPageSkeleton.jsx';

import SalesIcon from '../../../assets/dashboard/powerbi/card-assests/Sales.svg';
import FinanceIcon from '../../../assets/dashboard/powerbi/card-assests/finance.svg';
import CustomerIcon from '../../../assets/dashboard/powerbi/card-assests/customer.svg';
import HrIcon from '../../../assets/dashboard/powerbi/card-assests/HR.svg';
import OpsIcon from '../../../assets/dashboard/powerbi/card-assests/ops-icon.svg';

import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import ChevronDown from '../../../assets/dashboard/powerbi/chevron-down.svg';
import RefreshIcon from '../../../assets/dashboard/powerbi/refresh.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import { useToast } from '../../../components/Toast/useToast';

const REPORTS = [
  {
    id: 'sales',
    title: 'Sales Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: SalesIcon,
    path: '/powerbi/sales-analytics',
  },
  {
    id: 'financial',
    title: 'Financial Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: FinanceIcon,
    path: '/powerbi/report/financial',
  },
  {
    id: 'customer',
    title: 'Customer Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: CustomerIcon,
    path: '/powerbi/report/customer',
  },
  {
    id: 'hr',
    title: 'HR Analytics 2026',
    description:
      'Comprehensive overview of YTD sales performance, regional breakdowns, and pipeline forecasting.',
    refreshed: '2h ago',
    icon: HrIcon,
        path: '/powerbi/report/hr',
  },
  {
    id: 'operations',
    title: 'Operations Analytics 2026',
    description:
      'Supply chain logistics tracking, warehouse efficiency metrics, and vendor performance SLAs.',
    refreshed: '2h ago',
    icon: OpsIcon,
    path: '/powerbi/report/operations',
  },
];

function PowerBIPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getPowerBIReports().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const displayName = getWelcomeDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewReport = (path) => {
    if (path) navigate(path);
  };
  const handleRefresh = async () => {
  try {
    await getPowerBIReports();
    throw new Error('Simulated failure');
  } catch {
    // Refresh has no payload to merge; the simulated failure always surfaces this toast.
    showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
  }
};

  return (
    <div className="db-page pbi-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        {/* Page Content */}
        <div className="db-content pbi-content">
          {/* Welcome Section */}
          <section className="pbi-welcome">
            <div className="pbi-welcome__left">
              <div className="pbi-welcome__title-row">
                <h1>Welcome Back, {displayName}!</h1>

                <span className="db-realtime">
                  <span className="db-realtime__dot" />
                  <span>Real Time</span>
                </span>
              </div>

              <p className="pbi-welcome__sub">
                Stay organised with real-time insights, monitor your
                business performance, and track key metrics.
              </p>
            </div>

            <div className="pbi-welcome__actions">
              <button
                type="button"
                className="db-btn db-btn--outline pbi-btn--categories"
              >
                All Categories

                <img
                  src={ChevronDown}
                  className="pbi-btn__chevron"
                  alt=""
                  width="12"
                  height="8"
                />
              </button>

              <button
                type="button"
                className="db-btn db-btn--solid"
                onClick={handleRefresh}
              >
                <img
                  src={RefreshIcon}
                  alt=""
                  width="16"
                  height="16"
                />

                Refresh
              </button>
            </div>
          </section>

          {/* Power BI Reports */}
          {loading ? (
            <PowerBIPageSkeleton />
          ) : (
            <section
              className="pbi-reports"
              aria-label="Power BI reports"
            >
              {REPORTS.map((report) => (
                <article
                  key={report.id}
                  className="pbi-report-card"
                >
                  <div className="pbi-report-card__header">
                    <div className="pbi-report-card__icon">
                      <img
                        src={report.icon}
                        alt=""
                        width="54"
                        height="56"
                      />
                    </div>

                    <h2>{report.title}</h2>
                  </div>

                  <p className="pbi-report-card__desc">
                    {report.description}
                  </p>

                  <div className="pbi-report-card__footer">
                    <span className="pbi-report-card__meta">
                      <img
                        src={LastRefreshedIcon}
                        alt=""
                        width="18"
                        height="18"
                      />
                      <span>Last Refreshed: {report.refreshed}</span>
                    </span>

                    <button
                      type="button"
                      className="pbi-report-card__btn"
                      onClick={() => handleViewReport(report.path)}
                      disabled={!report.path}
                      aria-label={`View ${report.title}`}
                    >
                      View Report
                    </button>
                  </div>
                </article>
              ))}
            </section>
          )}
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default PowerBIPage;