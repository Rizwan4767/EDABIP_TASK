import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';

import '../../dashboard/pages/DashboardPage.css';
import './ReportsPage.css';
import DropdownSelect from '../components/DropdownSelect.jsx';
import ReportsPageSkeleton from '../components/ReportsPageSkeleton.jsx';
import { useReportsData } from '../hooks/useReportsData.js';

import {
  TotalReportsAreaChart,
  CompletedLineChart,
  FailedBarSparkline,
  ScheduledAreaChart,
  ReportTypeDistributionChart,
  ReportsByStatusDonutChart,
} from '../components/ReportsCharts.jsx';

import TrashIcon from '../../../assets/dashboard/users/trash.svg';
import SearchIcon from '../../../assets/dashboard/search.svg';
import SearchClear from '../../../assets/dashboard/charts/search-clear.svg';
import RefreshIcon from '../../../assets/dashboard/powerbi/refresh.svg';
import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import ExportIcon from '../../../assets/dashboard/reports/export.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE } from '../../../components/common/DateRangePicker/dateRange.js';
import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';

import TotalReportsIcon from '../../../assets/dashboard/reports/total_reports.svg';
import CompletedIcon from '../../../assets/dashboard/reports/completed.svg';
import FailedIcon from '../../../assets/dashboard/reports/failed.svg';
import ScheduledIcon from '../../../assets/dashboard/reports/scheduled.svg';
import AvgRunTimeIcon from '../../../assets/dashboard/reports/avg_runtime.svg';
import RecentTopTemplateIcon from '../../../assets/dashboard/reports/recent-top-template.svg';
import DownloadIcon from '../../../assets/dashboard/reports/download-button.svg';
import OptionsIcon from '../../../assets/dashboard/reports/options.svg';
import UptrendIcon from '../../../assets/dashboard/reports/uptrend.svg';
import DowntrendIcon from '../../../assets/dashboard/reports/downtrend.svg';
import ReloadIcon from '../../../assets/dashboard/reports/reload-button.svg';
import { useToast } from '../../../components/Toast/useToast';
import { getReportsData } from '../api/reportsApi.js';

const CATEGORY_OPTIONS = [
  'All Categories',
  'Sales',
  'Services',
  'Products',
  'Subscriptions',
];

const PERIOD_OPTIONS = [
  'Last 3 Months',
  'Last 6 Months',
  'Last 9 Months',
  'Last 12 Months',
];

function ReportsPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();

  const { reportsInfo, loading } = useReportsData();
  const { showError } = useToast();

  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [distributionPeriod, setDistributionPeriod] = useState(PERIOD_OPTIONS[1]);
  const [statusPeriod, setStatusPeriod] = useState(PERIOD_OPTIONS[1]);
  const [recentReportsPeriod, setRecentReportsPeriod] = useState('View All');
  const [templatesPeriod, setTemplatesPeriod] = useState('View All');

  const displayName = getWelcomeDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const PAGE_SIZE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const activityData = reportsInfo.activityData || [];
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return activityData.slice(startIndex, startIndex + PAGE_SIZE);
  }, [reportsInfo.activityData, currentPage]);

  const totalReports = reportsInfo.activityData ? reportsInfo.activityData.length : 0;
  const pageCount = Math.max(1, Math.ceil(totalReports / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const [selectedRows, setSelectedRows] = useState([]);
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentIds = new Set(paginatedData.map((row) => row.id));
      setSelectedRows((prev) => [...new Set([...prev, ...currentIds])]);
    } else {
      const currentIds = new Set(paginatedData.map((row) => row.id));
      setSelectedRows((prev) => prev.filter((rowId) => !currentIds.has(rowId)));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  const handleDeleteSelected = () => {
  if (selectedRows.length === 0) return;

  console.log('Delete selected reports:', selectedRows);

  // Remove this line later when the delete API is connected
  setSelectedRows([]);
  };

  const handleRefresh = async () => {
  try {
    await getReportsData();
    throw new Error('Simulated failure'); 
  } catch {
    // Refresh has no payload to merge; the simulated failure always surfaces this toast.
    showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
  }
};
  const getPageNumbers = () => {
    const pages = [];
    if (pageCount <= 5) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, 5);
    } else if (currentPage >= pageCount - 2) {
      for (let i = pageCount - 4; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2);
    }
    return pages;
  };

  return (
    <div className="db-page rep-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content rep-content">

          <div className="rep-page-head">
            <h1 className="rep-page-title">Reports</h1>
            <div className="rep-page-head__actions">
              <span className="rep-refreshed">
                <img src={LastRefreshedIcon} alt="" width="16" height="16" />
                <span>Last Refreshed: 2h ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon}
                buttonClassName="rep-export-btn"
                filename="reports"
                title="Reports"
                columns={[
                  { key: 'name', label: 'Report Name' },
                  { key: 'module', label: 'Module' },
                  { key: 'type', label: 'Type' },
                  { key: 'lastRun', label: 'Last Run' },
                  { key: 'owner', label: 'Owner' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={
                  selectedRows.length
                    ? (reportsInfo.activityData || []).filter((row) => selectedRows.includes(row.id))
                    : reportsInfo.activityData || []
                }
              />
            </div>
          </div>

          {loading ? (
            <ReportsPageSkeleton />
          ) : (
            <>
          <section className="rep-welcome" aria-label="Welcome and filters">
            <div className="rep-welcome__left">
              <div className="rep-welcome__title-row">
                <h2>Welcome Back, {displayName}!</h2>
                <span className="rep-realtime">
                  <span className="rep-realtime__dot" />
                  Real Time
                </span>
              </div>
              <p className="rep-welcome__sub">
                Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key Metrics.
              </p>
            </div>

            <div className="rep-welcome__actions">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <DropdownSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                ariaLabel="Select category"
              />
              <button type="button" className="rep-welcome-btn rep-welcome-btn--solid" onClick={handleRefresh}>
                <img src={RefreshIcon} alt="" width="14" height="14" />
                <span>Refresh</span>
              </button>
            </div>
          </section>

          <section className="rep-kpi-grid" aria-label="Key Metrics Grid">

            <article className="rep-kpi-card">
              <div className="rep-kpi-card__top">
                <img src={TotalReportsIcon} className="rep-kpi-card__icon" alt="" />
                <h3 className="rep-kpi-card__label">Total Reports</h3>
              </div>
              <div className="rep-kpi-card__middle">
                <p className="rep-kpi-card__value">{reportsInfo.kpis.totalReports}</p>
                <TotalReportsAreaChart />
              </div>
              <div className="rep-kpi-card__trend">
                <div className="rep-kpi-card__badge rep-kpi-card__badge--up">
                  <img src={UptrendIcon} alt="" style={{ marginRight: '4px', width: '10px', height: '10px' }} />
                  <span>+14 vs 30 last days</span>
                </div>
              </div>
            </article>

            <article className="rep-kpi-card">
              <div className="rep-kpi-card__top">
                <img src={CompletedIcon} className="rep-kpi-card__icon" alt="" />
                <h3 className="rep-kpi-card__label">Completed</h3>
              </div>
              <div className="rep-kpi-card__middle">
                <p className="rep-kpi-card__value">{reportsInfo.kpis.completed}</p>
                <CompletedLineChart />
              </div>
              <div className="rep-kpi-card__trend">
                <div className="rep-kpi-card__badge rep-kpi-card__badge--up">
                  <img src={UptrendIcon} alt="" style={{ marginRight: '4px', width: '10px', height: '10px' }} />
                  <span>+12% vs 30 last days</span>
                </div>
              </div>
            </article>

            <article className="rep-kpi-card">
              <div className="rep-kpi-card__top">
                <img src={FailedIcon} className="rep-kpi-card__icon" alt="" />
                <h3 className="rep-kpi-card__label">Failed</h3>
              </div>
              <div className="rep-kpi-card__middle">
                <p className="rep-kpi-card__value">{String(reportsInfo.kpis.failed).padStart(2, '0')}</p>
                <FailedBarSparkline />
              </div>
              <div className="rep-kpi-card__trend">
                <div className="rep-kpi-card__badge rep-kpi-card__badge--down">
                  <img src={DowntrendIcon} alt="" style={{ marginRight: '4px', width: '10px', height: '10px' }} />
                  <span>+25% vs 30 last days</span>
                </div>
              </div>
            </article>

            <article className="rep-kpi-card">
              <div className="rep-kpi-card__top">
                <img src={ScheduledIcon} className="rep-kpi-card__icon" alt="" />
                <h3 className="rep-kpi-card__label">Scheduled</h3>
              </div>
              <div className="rep-kpi-card__middle">
                <p className="rep-kpi-card__value">{String(reportsInfo.kpis.scheduled).padStart(2, '0')}</p>
                <ScheduledAreaChart />
              </div>
              <div className="rep-kpi-card__trend">
                <div className="rep-kpi-card__badge rep-kpi-card__badge--up">
                  <img src={UptrendIcon} alt="" style={{ marginRight: '4px', width: '10px', height: '10px' }} />
                  <span>+6% vs 30 last days</span>
                </div>
              </div>
            </article>
<article className="rep-kpi-card rep-kpi-card--avg-runtime">
  <div className="rep-kpi-card__top">
    <img src={AvgRunTimeIcon} className="rep-kpi-card__icon" alt="" />
    <h3 className="rep-kpi-card__label">Avg, Run Time</h3>
  </div>
  <div className="rep-kpi-card__middle">
    <p className="rep-kpi-card__value">{reportsInfo.kpis.avgRunTime}</p>
  </div>
   <div className="rep-kpi-card__trend">
                <div className="rep-kpi-card__badge rep-kpi-card__badge--up">
                <span></span>
                </div>
              </div>
</article>

          </section>

          <section className="rep-row rep-row--charts" aria-label="Charts Analysis">

            <article className="rep-card">
              <div className="rep-card__header">
                <h3>Report Type Distribution</h3>
                <PeriodDropdown
                  value={distributionPeriod}
                  onChange={setDistributionPeriod}
                  ariaLabel="Select distribution period"
                />
              </div>
              <ReportTypeDistributionChart />
            </article>

            <article className="rep-card">
              <div className="rep-card__header">
                <h3>Reports by Status</h3>
                <PeriodDropdown
                  value={statusPeriod}
                  onChange={setStatusPeriod}
                  ariaLabel="Select status period"
                />
              </div>
              <ReportsByStatusDonutChart />
            </article>

          </section>

          <section className="rep-row rep-row--split" aria-label="Recent activity lists">

            <article className="rep-card">
              <div className="rep-card__header">
                <h3>Recent Reports</h3>
                <DropdownSelect
                  value={recentReportsPeriod}
                  options={['View All']}
                  onChange={setRecentReportsPeriod}
                  ariaLabel="Recent reports action filter"
                  className="rep-dropdown--view-all"
                />
              </div>
              <div className="rep-list">
                {[
                  { name: 'Sales Performance Report', time: 'May 1st 2026 at 6 : 00 Am' },
                  { name: 'Financial Summary Report', time: 'May 1st 2026 at 6 : 00 Am' },
                  { name: 'Executive Overview Report', time: 'May 1st 2026 at 6 : 00 Am' }
                ].map((item) => (
                  <div key={item.name} className="rep-list__item">
                    <img src={RecentTopTemplateIcon} className="rep-list__icon" alt="" />
                    <div className="rep-list__copy">
                      <h4 className="rep-list__title">{item.name}</h4>
                      <p className="rep-list__sub">{item.time}</p>
                    </div>
                    <span className="rep-list__status rep-list__status--completed">Completed</span>
                    <button type="button" className="rep-list__more-btn" aria-label="More options">
                      <img src={OptionsIcon} alt="" width="16" height="16" />
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="rep-card">
              <div className="rep-card__header">
                <h3>Top Report Templates</h3>
                <DropdownSelect
                  value={templatesPeriod}
                  options={['View All']}
                  onChange={setTemplatesPeriod}
                  ariaLabel="Templates action filter"
                  className="rep-dropdown--view-all"
                />
              </div>
              <div className="rep-list">
                {[
                  { name: 'Executive Summary Template', time: 'Use 24 Min Ago' },
                  { name: 'Sales Analysis Template', time: 'Use 16 Min Ago' },
                  { name: 'Financial Report Template', time: 'Use 14 Min Ago' }
                ].map((item) => (
                  <div key={item.name} className="rep-list__item">
                    <img src={RecentTopTemplateIcon} className="rep-list__icon" alt="" />
                    <div className="rep-list__copy">
                      <h4 className="rep-list__title">{item.name}</h4>
                      <p className="rep-list__sub">{item.time}</p>
                    </div>
                    <button type="button" className="rep-list__action-btn">
                      Use
                    </button>
                    <button type="button" className="rep-list__more-btn" aria-label="More options">
                      <img src={OptionsIcon} alt="" width="16" height="16" />
                    </button>
                  </div>
                ))}
              </div>
            </article>

          </section>

          <section className="rep-row" aria-label="Recent activity table">
           <article className="rep-card rep-table-card">
 <div className="rep-card__header rep-card__header--activity">
  <h3>Recent Activity</h3>

  <div className="rep-activity-actions">

    <div className="rep-table-search">
      <img src={SearchIcon} alt="" width="14" height="14" />

      <input
        type="text"
        placeholder="Search"
        aria-label="Search recent activity"
      />

      <img
        src={SearchClear}
        alt=""
        className="rep-table-search__clear"
        width="14"
        height="14"
      />
    </div>

   {/* Delete button appears when checkbox is selected */}
  {selectedRows.length > 0 && (
    <button
      type="button"
      className="rep-delete-btn"
      onClick={handleDeleteSelected}
    >
      <img
        src={TrashIcon}
        alt=""
        width="16"
        height="16"
      />
      <span>Delete</span>
    </button>
  )}

    <button type="button" className="rep-download-btn">
      <img src={DownloadIcon} alt="" width="14" height="14" />
      <span>Download</span>
    </button>

  </div>
</div>

              <div className="rep-table-wrap">
                <table className="rep-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="rep-checkbox"
                          checked={paginatedData.length > 0 && paginatedData.every(row => selectedRows.includes(row.id))}
                          onChange={handleSelectAll}
                          aria-label="Select all rows"
                        />
                      </th>
                      <th>Report Name</th>
                      <th>Module</th>
                      <th>Type</th>
                      <th>Last Run</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            type="checkbox"
                            className="rep-checkbox"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => handleSelectRow(row.id)}
                            aria-label={`Select row ${row.id}`}
                          />
                        </td>
                        <td>
                          <span className="rep-link">{row.name}</span>
                        </td>
                        <td>{row.module}</td>
                        <td>{row.type}</td>
                        <td>{row.lastRun}</td>
                        <td>{row.owner}</td>
                        <td>
                          <span className={`rep-pill rep-pill--${row.status.toLowerCase()}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          <div className="rep-actions-cell">
                            {row.status === 'Failed' ? (
                              <button type="button" className="rep-action-icon-btn" aria-label="Retry report run">
                                <img src={ReloadIcon} alt="" width="14" height="14" />
                              </button>
                            ) : (
                              <button type="button" className="rep-action-icon-btn" aria-label="Download report file">
                                <img src={DownloadIcon} alt="" width="14" height="14" />
                              </button>
                            )}
                            <button type="button" className="rep-action-icon-btn" aria-label="Row options">
                              <img src={OptionsIcon} alt="" width="14" height="14" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rep-pagination">
                <p className="rep-pagination__text">
                  Showing {startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, totalReports)} of {totalReports} users
                </p>
                <div className="rep-pagination__controls">
                  <button
                    type="button"
                    className="rep-pagination__btn rep-pagination__btn--nav"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    &lt; Back
                  </button>
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`rep-pagination__btn ${pageNumber === currentPage ? 'rep-pagination__btn--active' : ''}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="rep-pagination__btn rep-pagination__btn--nav"
                    disabled={currentPage === pageCount}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            </article>
          </section>
            </>
          )}
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;

              