import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import './DashboardPage.css';

import SearchIcon from '../../../assets/dashboard/search.svg';
import RevenueIcon from '../../../assets/dashboard/revenue.svg';
import CustomersIcon from '../../../assets/dashboard/customers.svg';
import ReportsIcon from '../../../assets/dashboard/reports.svg';
import RefreshIcon1 from '../../../assets/dashboard/powerbi/refresh.svg';
import WarningTriangleIcon from '../../../assets/dashboard/warning-triangle-red.svg';
import CloseXIcon from '../../../assets/dashboard/users/cancel.svg';

import SearchClear from '../../../assets/dashboard/charts/search-clear.svg';
import ArrowUp from '../../../assets/dashboard/charts/arrow-up.svg';
import ArrowUpSm from '../../../assets/dashboard/charts/arrow-up-sm.svg';
import RevenueSparkline from '../../../assets/dashboard/charts/revenue-sparkline.svg';
import HealthSparkline from '../../../assets/dashboard/charts/health-sparkline.svg';
import ChevronDown from '../../../assets/dashboard/charts/chevron-down.svg';
import StatIcon from '../../../assets/dashboard/charts/stat-icon.svg';
import StatPeak from '../../../assets/dashboard/charts/stat-peak.svg';
import StatAvg from '../../../assets/dashboard/charts/stat-avg.svg';
import StatUpdated from '../../../assets/dashboard/charts/stat-updated.svg';
import ReportIcon from '../../../assets/dashboard/data-source/reports-icon.svg';
import TotalSourceIcon from '../../../assets/dashboard/data-source/total-source.svg';
import HealthyIcon from '../../../assets/dashboard/data-source/healthy.svg';
import WarningIcon from '../../../assets/dashboard/data-source/warning.svg';
import InactiveIcon from '../../../assets/dashboard/data-source/inactive.svg';
import ClockIcon from '../../../assets/dashboard/charts/clock.svg';
import LatencyDot from '../../../assets/dashboard/charts/latency-dot.svg';
import { ActiveUsersChart, RevenueTrendChart } from '../components/DashboardCharts.jsx';
import { useDashboardData } from '../hooks/useDashboardData.js';
import DashboardPageSkeleton, { DashboardKpiSkeleton } from '../components/DashboardPageSkeleton.jsx';
import {
  UpdateProfileModal,
  useIncompleteProfilePrompt,
} from '../../profile-completion/index.js';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE } from '../../../components/common/DateRangePicker/dateRange.js';

// Icons stay in the page — the api layer returns data only, never assets.
const USER_STAT_ICONS = {
  growth: StatIcon,
  peak: StatPeak,
  average: StatAvg,
  updated: StatUpdated,
};

const SOURCE_STAT_ICONS = {
  total: TotalSourceIcon,
  healthy: HealthyIcon,
  warning: WarningIcon,
  inactive: InactiveIcon,
};

function StatusPill({ status }) {
  const isActive = status === 'Active';
  return (
    <span className={`db-pill ${isActive ? 'db-pill--active' : 'db-pill--inactive'}`}>
      {status}
    </span>
  );
}

import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';


function DashboardPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [activitySearch, setActivitySearch] = useState('');
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [showRefreshError, setShowRefreshError] = useState(false);
  const { data, loading } = useDashboardData();
  const { isOpen: isProfilePromptOpen, dismiss: dismissProfilePrompt } =
    useIncompleteProfilePrompt(user);

  useEffect(() => {
    if (!showRefreshError) return undefined;
    const timer = setTimeout(() => setShowRefreshError(false), 5000);
    return () => clearTimeout(timer);
  }, [showRefreshError]);

  const {
    kpis,
    userStats,
    sourceStats,
    dataSources,
    scheduledReports,
    recentActivity,
  } = data;

  const displayName = getWelcomeDisplayName(user);

  const filteredActivity = useMemo(() => {
    const q = activitySearch.trim().toLowerCase();
    if (!q) return recentActivity;
    return recentActivity.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [activitySearch, recentActivity]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="db-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content" aria-busy={loading}>
          <section className="db-welcome">
            <div className="db-welcome__inner">
              <div className="db-welcome__head">
                <div className="db-welcome__left">
                  <div className="db-welcome__title-row">
                    <h1>Welcome Back, {displayName}!</h1>
                    <span className="db-realtime">
                      <span className="db-realtime__dot" />
                      Real Time
                    </span>
                  </div>
                  <p className="db-welcome__sub">
                    Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key Metrics.
                  </p>
                </div>
                <div className="db-welcome__actions">
                  <Link to="/book-demo" className="db-btn db-btn--request">
                    Request Demo
                  </Link>
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                  <button
                    type="button"
                    className="db-btn db-btn--solid"
                    onClick={() => setShowRefreshError(true)}
                  >
                    <img src={RefreshIcon1} alt="" width="16" height="16" />
                    Refresh
                  </button>
                </div>
              </div>

              {showRefreshError ? (
                <div className="db-refresh-error" role="alert">
                  <img src={WarningTriangleIcon} alt="" className="db-refresh-error__icon" />
                  <div className="db-refresh-error__copy">
                    <p className="db-refresh-error__title">Unable to Refresh Data</p>
                    <p className="db-refresh-error__subtitle">
                      We couldn&apos;t refresh the data right now.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="db-refresh-error__close"
                    aria-label="Dismiss"
                    onClick={() => setShowRefreshError(false)}
                  >
                    <img src={CloseXIcon} alt="" width="14" height="14" />
                  </button>
                </div>
              ) : null}

              {loading ? <DashboardKpiSkeleton /> : null}
              {!loading && kpis ? (
                <div className="db-kpi-grid">
                  <article className="db-kpi-card">
                    <div className="db-kpi-card__header">
                      <img src={RevenueIcon} alt="" className="db-kpi-card__icon" />
                      <h2>REVENUE</h2>
                    </div>
                    <div className="db-kpi-card__metrics">
                      <div>
                        <p className="db-kpi-card__value">{kpis.revenue.value}</p>
                        <p className="db-kpi-card__label">{kpis.revenue.label}</p>
                      </div>
                      <div>
                        <div className="db-kpi-card__change">
                          <img src={ArrowUp} alt="" />
                          <span>{kpis.revenue.change}</span>
                        </div>
                        <p className="db-kpi-card__muted">{kpis.revenue.changeNote}</p>
                      </div>
                    </div>
                    <img src={RevenueSparkline} alt="" className="db-kpi-card__spark" />
                  </article>

                  <article className="db-kpi-card">
                    <div className="db-kpi-card__header">
                      <img src={CustomersIcon} alt="" className="db-kpi-card__icon" />
                      <h2>CUSTOMERS</h2>
                    </div>
                    <div className="db-kpi-card__metrics">
                      <div>
                        <p className="db-kpi-card__value">{kpis.customers.value}</p>
                        <p className="db-kpi-card__label">{kpis.customers.label}</p>
                      </div>
                      <div>
                        <div className="db-kpi-card__change">
                          <img src={ArrowUpSm} alt="" />
                          <span>{kpis.customers.change}</span>
                        </div>
                        <p className="db-kpi-card__muted">{kpis.customers.changeNote}</p>
                      </div>
                    </div>
                    <div className="db-progress-block">
                      <div className="db-progress-block__label">
                        <strong>{kpis.customers.activeLabel}</strong>
                        <span>{kpis.customers.activeNote}</span>
                      </div>
                      <div className="db-progress">
                        <div
                          className="db-progress__fill"
                          style={{ width: `${kpis.customers.activeProgress}%` }}
                        />
                      </div>
                    </div>
                  </article>

                  <article className="db-kpi-card">
                    <div className="db-kpi-card__header">
                      <img src={ReportsIcon} alt="" className="db-kpi-card__icon" />
                      <h2>REPORTS</h2>
                    </div>
                    <div className="db-kpi-card__metrics db-kpi-card__metrics--reports">
                      <div>
                        <p className="db-kpi-card__value">{kpis.reports.value}</p>
                        <p className="db-kpi-card__label">{kpis.reports.label}</p>
                      </div>
                      <span className="db-badge db-badge--warn">{kpis.reports.badge}</span>
                    </div>
                    <div className="db-kpi-card__divider" />
                    <div className="db-kpi-card__rows">
                      {kpis.reports.rows.map((row) => (
                        <div key={row.id} className="db-kpi-card__row">
                          <span>{row.label}</span>
                          <strong>{row.value}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="db-kpi-card">
                    <div className="db-kpi-card__header">
                      <img src={ReportsIcon} alt="" className="db-kpi-card__icon" />
                      <h2>SYSTEM HEALTH</h2>
                    </div>
                    <div className="db-kpi-card__metrics db-kpi-card__metrics--reports">
                      <div>
                        <p className="db-kpi-card__value">{kpis.systemHealth.value}</p>
                        <p className="db-kpi-card__label">{kpis.systemHealth.label}</p>
                      </div>
                      <span className="db-badge db-badge--ok">{kpis.systemHealth.badge}</span>
                    </div>
                    <div className="db-kpi-card__divider" />
                    <img src={HealthSparkline} alt="" className="db-kpi-card__spark" />
                  </article>
                </div>
              ) : null}
            </div>
          </section>

          {loading ? (
            <DashboardPageSkeleton />
          ) : (
            <>
              <section className="db-charts-row">
                <article className="db-card db-card--revenue">
                  <div className="db-card__header">
                    <h3>Revenue Trend</h3>
                    <PeriodDropdown />
                  </div>
                  <RevenueTrendChart />
                </article>

                <article className="db-card db-card--users">
                  <div className="db-card__header">
                    <h3>Active Users</h3>
                    <PeriodDropdown />
                  </div>
                  <ActiveUsersChart />
                  <div className="db-users-stats">
                    {userStats.map((stat) => (
                      <div key={stat.id} className="db-users-stat">
                        <img src={USER_STAT_ICONS[stat.id]} alt="" />
                        <div>
                          <p>{stat.label}</p>
                          <strong className={stat.tone === 'green' ? 'db-users-stat--green' : undefined}>
                            {stat.value}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="db-mid-row">
                <article className="db-card db-card--sources">
                  <div className="db-card__header">
                    <div className="db-card__title-group">
                      <h3>Active Data Source</h3>
                      <span className="db-badge db-badge--warn">Auto Refresh: Every 60 Seconds</span>
                    </div>
                    <button type="button" className="db-card__menu db-card__menu--end">
                      View all
                      <img src={ChevronDown} alt="" width="16" height="16" />
                    </button>
                  </div>

                  <div className="db-source-stats">
                    {sourceStats.map((stat) => (
                      <div key={stat.id} className="db-source-stat">
                        <img src={SOURCE_STAT_ICONS[stat.id]} alt="" />
                        <div>
                          <p>{stat.label}</p>
                          <strong>{stat.value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="db-table-wrap">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Source</th>
                          <th>Status</th>
                          <th>Health</th>
                          <th>Last Sync</th>
                          <th>Latency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataSources.map((row) => (
                          <tr key={row.source}>
                            <td>{row.source}</td>
                            <td>
                              <StatusPill status={row.status} />
                            </td>
                            <td>
                              <div className="db-health">
                                <span>{row.health} %</span>
                                <div className="db-health__track">
                                  <div
                                    className="db-health__fill"
                                    style={{ width: `${row.health}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="db-sync">
                                <img src={ClockIcon} alt="" width="16" height="16" />
                                {row.sync}
                              </span>
                            </td>
                            <td>
                              <span className="db-latency">
                                <img src={LatencyDot} alt="" width="8" height="8" />
                                {row.latency}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="db-card db-card--scheduled">
                  <div className="db-card__header">
                    <h3>Recent Activity</h3>
                    <PeriodDropdown />
                  </div>
                  <ul className="db-schedule-list">
                    {scheduledReports.map((item) => (
                      <li key={item.id} className="db-schedule-item">
                        <img src={ReportIcon} alt="" className="db-schedule-item__icon" />
                        <div className="db-schedule-item__copy">
                          <p className="db-schedule-item__title">{item.title}</p>
                          <p className="db-schedule-item__when">{item.when}</p>
                        </div>
                        <StatusPill status={item.status} />
                        <button type="button" className="db-kebab" aria-label="More options">
                          <span />
                          <span />
                          <span />
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>
              </section>

              <section className="db-card db-card--activity">
<div className="db-card__header db-card__header--activity">
  <h3>Recent Activity</h3>
  <div className="db-search db-search--sm">
    <img src={SearchIcon} alt="" className="db-search__icon" width="14" height="14" />
    <input
      type="text"
      placeholder="Search Records"
      value={activitySearch}
      onChange={(e) => setActivitySearch(e.target.value)}
      aria-label="Search records"
    />
    {activitySearch && (
      <button
        type="button"
        className="db-search__clear"
        onClick={() => setActivitySearch('')}
        aria-label="Clear search"
      >
        <img src={SearchClear} alt="" className="db-search__clear-icon" width="14" height="14" />
      </button>
    )}
  </div>
</div>
          
                <div className="db-table-wrap">
                  <table className="db-table db-table--activity">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Module</th>
                        <th>Action</th>
                        <th>Time</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivity.map((row, idx) => (
                        <tr key={`${row.id}-${row.time}-${idx}`}>
                          <td>{row.id}</td>
                          <td>{row.user}</td>
                          <td>{row.module}</td>
                          <td>{row.action}</td>
                          <td>{row.time}</td>
                          <td>{row.date}</td>
                          <td>
                            <StatusPill status={row.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
          <AppFooter />
        </div>
      </div>

      <UpdateProfileModal
        isOpen={isProfilePromptOpen}
        onDismiss={dismissProfilePrompt}
      />
    </div>
  );
}

export default DashboardPage;