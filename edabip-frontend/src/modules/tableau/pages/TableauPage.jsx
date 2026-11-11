import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './TableauPage.css';
import { getTableauData } from '../api/tableauApi.js';
import TableauPageSkeleton from '../components/TableauPageSkeleton.jsx';
import {
  TrendAnalysisChart,
  RevenueCategoryChart,
  RevenueForecastChart,
} from '../components/TableauCharts.jsx';

import RefreshIcon from '../../../assets/dashboard/powerbi/refresh.svg';
import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import ChevronDown from "../../../assets/dashboard/powerbi/chevron-down.svg";
import ExportIcon1 from '../../../assets/dashboard/tableau/export-icon-1.svg';
import DonutChart from '../../../assets/dashboard/tableau/donut-chart.svg';
import SparklineUp from '../../../assets/dashboard/tableau/sparkline-up.svg';
import SparklineDown from '../../../assets/dashboard/tableau/sparkline-down.svg';
import TrendUp from '../../../assets/dashboard/tableau/trend-up-green.svg';
import TrendDown from '../../../assets/dashboard/tableau/trend-down.svg';
import KpiRevenue from '../../../assets/dashboard/tableau/kpi-revenue.svg';
import kpisalesperformance from '../../../assets/dashboard/tableau/kpi-sales-performance.svg';
import KpiCustomerInsights from '../../../assets/dashboard/tableau/kpi-customer-insights.svg';
import KpiProfit from '../../../assets/dashboard/tableau/kpi-profit.svg';
import KpiProfit1 from '../../../assets/dashboard/tableau/kpi-active-projects.svg';
import KpiProfit2 from '../../../assets/dashboard/tableau/kpi-profit-2.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE } from '../../../components/common/DateRangePicker/dateRange.js';
import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';
import KpiCustomers from '../../../assets/dashboard/tableau/kpi-customers.svg';
import KpiIncidents1 from '../../../assets/dashboard/tableau/kpi-incidents-1.svg';
import KpiFolder from '../../../assets/dashboard/tableau/kpi-folder.svg';
import ActivityShare from '../../../assets/dashboard/tableau/activity-share.svg';
import arrowUp from '../../../assets/dashboard/tableau/arrow-up.svg';
import arrowDown from '../../../assets/dashboard/tableau/arrow-down.svg';
import { useToast } from '../../../components/Toast/useToast';

const PERIOD_OPTIONS = [
  'Last 3 Months',
  'Last 6 Months',
  'Last 9 Months',
  'Last 12 Months',
];

const CATEGORY_OPTIONS = [
  'All Categories',
  'Sales',
  'Services',
  'Products',
  'Subscriptions',
];

const KPI_CARDS = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$125.8M',
    change: '12.5% vs Apr 2025',
    positive: true,
    icon: KpiRevenue,
  },
  {
    id: 'profit',
    label: 'Total Profit',
    value: '$125.8M',
    change: '8.7% vs Apr 2025',
    positive: true,
    icon: KpiProfit,
  },
  {
    id: 'customers',
    label: 'Total Customers',
    value: '12,863',
    change: '6.3% vs Apr 2025',
    positive: true,
    icon: KpiCustomers,
  },
  {
    id: 'projects',
    label: 'Active Projects',
    value: '86',
    change: '4.0% vs Apr 2025',
    positive: true,
    icon: KpiProfit1,
  },
  {
    id: 'incidents',
    label: 'Open Incidents',
    value: '23',
    change: '18.2% vs Apr 2025',
    positive: false,
    icon: KpiIncidents1,
  },
  {
    id: 'uptime',
    label: 'System Uptime',
    value: '99.92%',
    change: '0.02% vs Apr 2025',
    positive: true,
    icon: KpiProfit2,
  },
];

const KEY_MATRIX = [
  { id: 'margin', label: 'Gross Margin', value: '22.6%', change: '3.6%', positive: true, spark: SparklineUp },
  { id: 'retention', label: 'Customer Retention', value: '22.6%', change: '3.6%', positive: true, spark: SparklineUp },
  { id: 'deal', label: 'Avg.Deal Size', value: '15.7K', change: '3.6%', positive: true, spark: SparklineUp },
  { id: 'cost', label: 'Cost to Serve', value: '2.18K', change: '3.6%', positive: false, spark: SparklineDown },
];

const TOP_DASHBOARDS = [
  { name: 'Executive Overview', category: 'Executive', owner: 'Rohit Sharma', updated: 'May 31,2025', tone: 'executive' },
  { name: 'Sales Performance', category: 'Sales', owner: 'Anita Varma', updated: 'Jun 31,2025', tone: 'sales' },
  { name: 'Financial Summary', category: 'Finance', owner: 'Karan Mehta', updated: 'July 31,2025', tone: 'finance' },
  { name: 'Customer Insights', category: 'Customer', owner: 'Priya Nair', updated: 'Aug 31,2025', tone: 'customer' },
  { name: 'Operations Dashboard', category: 'Operations', owner: 'Vikram Singh', updated: 'Sep 31,2025', tone: 'operations' },
];

const RECENT_ACTIVITY = [
  {
    id: 1,
    title: 'Sales Performance Dashboard',
    subtitle: 'Viewed by Anitha Varma',
    time: '10:30 AM',
    icon: kpisalesperformance,
  },
  {
    id: 2,
    title: 'Financial Summary dashboard',
    subtitle: 'Viiewed by Karan Mehta',
    time: '10:30 AM',
    icon: KpiFolder,
  },
  {
    id: 3,
    title: 'Executive Overview dashboard',
    subtitle: 'Viewed by Priya Nair',
    time: '10:30 AM',
    icon: ActivityShare,
  },
  {
    id: 4,
    title: 'Customer Insghts dashboard',
    subtitle: 'May 1st 2026 at 6 : 00 Am',
    time: '10:30 AM',
    icon: KpiCustomerInsights,
  },
];

function DropdownSelect({
  value,
  options,
  onChange,
  icon,
  className = '',
  buttonClassName = '',
  ariaLabel,
  showChevron = true,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className={`tb-dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`db-btn db-btn--outline ${buttonClassName}${open ? ' tb-dropdown__btn--open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon ? <img src={icon} alt="" width="14" height="14" /> : null}
        <span className="tb-dropdown__label">{value}</span>
        {showChevron ? (
          <img src={ChevronDown} className="tb-btn__chevron" alt="" width="12" height="8" />
        ) : null}
      </button>
      {open ? (
        <ul className="tb-dropdown__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`tb-dropdown__option${option === value ? ' tb-dropdown__option--active' : ''}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TableauPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [trendPeriod, setTrendPeriod] = useState(PERIOD_OPTIONS[1]);
  const [categoryPeriod, setCategoryPeriod] = useState(PERIOD_OPTIONS[1]);
  const [matrixPeriod, setMatrixPeriod] = useState(PERIOD_OPTIONS[1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getTableauData().finally(() => {
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
  const handleRefresh = async () => {
  try {
    await getTableauData();
    throw new Error('Simulated failure');
  } catch {
    // Refresh has no payload to merge; the simulated failure always surfaces this toast.
    showError('Unable to Refresh Data', "We couldn't refresh the data right now.");
  }
};

  return (
    <div className="db-page tb-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content tb-content">
          <div className="tb-page-head">
            <h1 className="tb-page-title">Tableau Visualization</h1>
            <div className="tb-page-head__actions">
              <span className="tb-refreshed">
                <img src={LastRefreshedIcon} alt="" width="16" height="16" />
                <span>Last Refreshed: 2h ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon1}
                buttonClassName="db-btn db-btn--solid tb-export-btn"
                filename="tableau-dashboards"
                title="Tableau Visualization"
                columns={[
                  { key: 'name', label: 'Dashboard' },
                  { key: 'category', label: 'Category' },
                  { key: 'owner', label: 'Owner' },
                  { key: 'updated', label: 'Last Updated' },
                ]}
                rows={TOP_DASHBOARDS}
              />
            </div>
          </div>

          <section className="tb-welcome">
            <div className="tb-welcome__left">
              <div className="tb-welcome__title-row">
                <h2>Welcome Back, {displayName}!</h2>
                <span className="db-realtime">
                  <span className="db-realtime__dot" />
                  <span>Real Time</span>
                </span>
              </div>
              <p className="tb-welcome__sub">
                Stay Organised with real time insight, Monitor Your Bussiness Perfomence and key
                Metrics.
              </p>
            </div>

            <div className="tb-welcome__actions">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <DropdownSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                buttonClassName="tb-welcome-btn tb-btn--categories"
                ariaLabel="Select category"
              />
              <button type="button" className="db-btn db-btn--solid tb-welcome-btn" onClick={handleRefresh}>
                <img src={RefreshIcon} alt="" width="14" height="14" />
                <span>Refresh</span>
              </button>
            </div>
          </section>

          {loading ? (
            <TableauPageSkeleton />
          ) : (
            <>
              <section className="tb-kpi-grid" aria-label="Key metrics">
                {KPI_CARDS.map((card) => (
                  <article key={card.id} className="tb-kpi-card">
                    <div className="tb-kpi-card__top">
                      <img src={card.icon} alt="" className="tb-kpi-card__icon" width="54" height="56" />
                      <div className="tb-kpi-card__copy">
                        <p className="tb-kpi-card__label">{card.label}</p>
                        <p className="tb-kpi-card__value">{card.value}</p>
                      </div>
                    </div>
                    <div
                      className={`tb-kpi-card__change ${card.positive ? 'tb-kpi-card__change--up' : 'tb-kpi-card__change--down'
                        }`}
                    >
                      <img
                        src={card.positive ? arrowUp : arrowDown}
                        alt=""
                        className="tb-kpi-card__change-icon"
                        width="14"
                        height="14"
                      />

                      <span className="tb-kpi-card__change-text">
                        <span className={card.positive ? 'tb-kpi-card__change-value--up' : 'tb-kpi-card__change-value--down'}>
                          {card.change.split(' vs ')[0]}
                        </span>
                        <span className="tb-kpi-card__change-label">
                          {'\u00A0vs '}{card.change.split(' vs ')[1]}
                        </span>
                      </span>
                    </div>
                  </article>
                ))}
              </section>

              <section className="tb-row tb-row--charts">
                <article className="tb-card tb-card--trend">
                  <div className="tb-card__header">
                    <h3>Trend Analysis - Revenue Over Time</h3>
                    <PeriodDropdown
                      value={trendPeriod}
                      onChange={setTrendPeriod}
                      ariaLabel="Select trend period"
                    />
                  </div>
                  <TrendAnalysisChart />
                </article>

                <article className="tb-card tb-card--category">
                  <div className="tb-card__header">
                    <h3>Revenue Category</h3>
                    <PeriodDropdown
                      value={categoryPeriod}
                      onChange={setCategoryPeriod}
                      ariaLabel="Select category period"
                    />
                  </div>
                  <RevenueCategoryChart donutSrc={DonutChart} />
                </article>
              </section>

              <section className="tb-row tb-row--mid">
                <article className="tb-card tb-card--forecast">
                  <div className="tb-card__header">
                    <h3>Revenue Forecast( Next 3 Months)</h3>
                  </div>
                  <RevenueForecastChart />
                </article>

                <article className="tb-card tb-card--matrix">
                  <div className="tb-card__header">
                    <h3>Key Matrix</h3>
                    <PeriodDropdown
                      value={matrixPeriod}
                      onChange={setMatrixPeriod}
                      ariaLabel="Select key matrix period"
                    />
                  </div>
                  <div className="tb-matrix-grid">
                    {KEY_MATRIX.map((item) => (
                      <div key={item.id} className="tb-matrix-card">
                        <div className="tb-matrix-card__head">
                          <p className="tb-matrix-card__label">{item.label}</p>
                          <div
                            className={`tb-matrix-card__change ${item.positive
                              ? 'tb-matrix-card__change--up'
                              : 'tb-matrix-card__change--down'
                              }`}
                          >
                            <img
                              src={item.positive ? TrendUp : TrendDown}
                              alt=""
                              width="12"
                              height="12"
                            />
                            <span>{item.change}</span>
                          </div>
                        </div>
                        <div className="tb-matrix-card__body">
                          <strong>{item.value}</strong>
                          <img src={item.spark} alt="" className="tb-matrix-card__spark" />
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="tb-row tb-row--bottom">
                <article className="tb-card tb-card--table">
                  <div className="tb-card__header">
                    <h3>Top Performing Dashboard</h3>
                    <span className="tb-view-all">
                      View All
                      <img src={ChevronDown} alt="" className="tb-icon-12" />
                    </span>
                  </div>
                  <div className="tb-table-wrap">
                    <table className="tb-table">
                      <thead>
                        <tr>
                          <th>Dashboard Name</th>
                          <th>Category</th>
                          <th>Owner</th>
                          <th>Last Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TOP_DASHBOARDS.map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td>
                              <span className={`tb-cat-pill tb-cat-pill--${row.tone}`}>
                                {row.category}
                              </span>
                            </td>
                            <td>{row.owner}</td>
                            <td>{row.updated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>

                <article className="tb-card ">
                  <div className="tb-card__header">
                    <h3>Recent Activity</h3>
                    <span className="tb-view-all">
                      View All
                      <img src={ChevronDown} alt="" className="tb-icon-12" />
                    </span>
                  </div>
                  <ul className="tb-activity">
                    {RECENT_ACTIVITY.map((item) => (
                      <li key={item.id} className="tb-activity__item">
                        <img
                          src={item.icon}
                          alt=""
                          className="tb-activity__icon"
                          width="34"
                          height="36"
                        />
                        <div className="tb-activity__copy">
                          <p className="tb-activity__title">{item.title}</p>
                          <p className="tb-activity__sub">{item.subtitle}</p>
                        </div>
                        <span className="tb-activity__time">{item.time}</span>
                      </li>
                    ))}
                  </ul>
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

export default TableauPage;
