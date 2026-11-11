import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import { getWelcomeDisplayName } from '../../auth/utils/getWelcomeDisplayName.js';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './Analyticspage.css';
import { RevenueForecastChart, DemandPredictionChart } from '../components/AnalyticsCharts.jsx';
import AnalyticsPageSkeleton from '../components/AnalyticsPageSkeleton.jsx';
import RefreshIcon from '../../../assets/dashboard/powerbi/refresh.svg';
import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import ChevronDown from '../../../assets/dashboard/tableau/chevron-down.svg';
import ExportIcon from '../../../assets/dashboard/analytics/export-icon.svg';
import TrendUp from '../../../assets/dashboard/analytics/trend-up-black.svg';
import TrendDown from '../../../assets/dashboard/analytics/trend-down.svg';
import KpiAccuracy from '../../../assets/dashboard/analytics/Model-accuracy.svg';
import KpiPrecision from '../../../assets/dashboard/analytics/precison.svg';
import KpiRecall from '../../../assets/dashboard/analytics/Recall.svg';
import KpiF1Score from '../../../assets/dashboard/analytics/F1Score.svg';
import ModelAccuracyGraph from '../../../assets/dashboard/analytics/model-graph.svg';
import PrecisionGraph from '../../../assets/dashboard/analytics/precision-Graph.svg';
import RecallGraph from '../../../assets/dashboard/analytics/Recall-Graph.svg';
import F1ScoreGraph from '../../../assets/dashboard/analytics/F1Score_graph.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import DateRangePicker from '../../../components/common/DateRangePicker/index.jsx';
import { DEFAULT_DATE_RANGE } from '../../../components/common/DateRangePicker/dateRange.js';
import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';
import { useToast } from '../../../components/Toast/useToast'; 
import { getAnalyticsData } from '../api/analyticsApi';

const PERIOD_OPTIONS = [
  'Last 3 Months',
  'Last 6 Months',
  'Last 9 Months',
  'Last 12 Months',
];

const CATEGORY_OPTIONS = [
  'All Categories',
];

const METRIC_CARDS = [
  {
    id: 'accuracy',
    label: 'Model Accuracy',
    change: '+12% vs last month',
    positive: true,
    value: '98.4%',
    icon: KpiAccuracy,
    graph: ModelAccuracyGraph,
  },
  {
    id: 'precision',
    label: 'Precision',
    change: '+0.3% vs last month',
    positive: false,
    value: '0.97',
    icon: KpiPrecision,
    graph: PrecisionGraph,
  },
  {
    id: 'recall',
    label: 'Recall',
    change: '+45 new this week',
    positive: true,
    value: '0.96',
    icon: KpiRecall,
    graph: RecallGraph,
    badgeClass: 'an-kpi-card__change--recall',
  },
  {
    id: 'f1',
    label: 'F1 Score',
    change: '+8.1% vs last quarter',
    positive: true,
    value: '0.96',
    icon: KpiF1Score,
    graph: F1ScoreGraph,
  },
];

const MODEL_REGISTRY = [
  { name: 'Sales Forecasting', type: 'Regression', accuracy: '98.4%', status: 'Training 75%' },
  { name: 'Demand Prediction', type: 'Random Forest', accuracy: '94.2%', status: 'Active' },
  { name: 'Customer Churn', type: 'Classification', accuracy: '91.8%', status: 'Active' },
  { name: 'Inventory Optimization', type: 'Optimization', accuracy: '-', status: 'Pending' },
];

function statusTone(status) {
  const s = status.toLowerCase();
  if (s.startsWith('training')) return 'training';
  if (s === 'active') return 'active';
  if (s === 'pending') return 'pending';
  return 'idle';
}

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

function AnalyticsPage() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [dateRange, setDateRange] = useState(DEFAULT_DATE_RANGE);
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [forecastPeriod, setForecastPeriod] = useState(PERIOD_OPTIONS[1]);
  const [demandPeriod, setDemandPeriod] = useState(PERIOD_OPTIONS[1]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const displayName = getWelcomeDisplayName(user);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
const handleRefresh = async () => {
  try {
    await getAnalyticsData();
    throw new Error ('Test Error');
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
            <h1 className="tb-page-title">Analytics</h1>
            <div className="tb-page-head__actions">
              <span className="tb-refreshed">
                <img src={LastRefreshedIcon} alt="" width="16" height="16" />
                <span>Last Refreshed: 2hr ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon}
                buttonClassName="db-btn db-btn--solid tb-export-btn"
                filename="analytics"
                title="Analytics"
                columns={[
                  { key: 'name', label: 'Model' },
                  { key: 'type', label: 'Type' },
                  { key: 'accuracy', label: 'Accuracy' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={MODEL_REGISTRY}
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
            <AnalyticsPageSkeleton />
          ) : (
            <>
              <section className="tb-kpi-grid an-kpi-grid" aria-label="Model metrics">
                {METRIC_CARDS.map((card) => (
                  <article key={card.id} className="tb-kpi-card an-kpi-card">
                    <div className="an-kpi-card__head">
                      <img src={card.icon} alt="" className="an-kpi-card__icon"  width="54" height="56" />
                      <p className="an-kpi-card__label">{card.label}</p>
                    </div>
                    <div className="an-kpi-card__value-row">
                      <p className="an-kpi-card__value">{card.value}</p>
                      <div className="an-kpi-card__spark">
                        <img src={card.graph} alt="" width="327.75" height="46" />
                      </div>
                    </div>
                    <div
                      className={`an-kpi-card__change ${card.positive ? 'an-kpi-card__change--up' : 'an-kpi-card__change--down'
                        } ${card.badgeClass || ''}`}
                    >
                      <img src={card.positive ? TrendUp : TrendDown} alt="" width="12" height="12" />
                      <span>{card.change}</span>
                    </div>
                  </article>
                ))}
              </section>

              <section className="tb-row tb-row--charts">
                <article className="tb-card">
                  <div className="tb-card__header">
                    <h3>Revenue Forecast</h3>
                    <PeriodDropdown
                      value={forecastPeriod}
                      onChange={setForecastPeriod}
                      ariaLabel="Select revenue forecast period"
                    />
                  </div>
                  <RevenueForecastChart />
                </article>

                <article className="tb-card">
                  <div className="tb-card__header">
                    <h3>Demand Prediction (Next 7 Days)</h3>
                    <PeriodDropdown
                      value={demandPeriod}
                      onChange={setDemandPeriod}
                      ariaLabel="Select demand prediction period"
                    />
                  </div>
                  <DemandPredictionChart />
                </article>
              </section>

              <section className="an-registry-row">
                <article className="tb-card tb-card--table">
                  <div className="tb-card__header">
                    <h3>ML Model Registry</h3>
                    <button type="button" className="an-view-all">
                      <span>View All</span>
                      <img src={ChevronDown} alt="" width="12" height="8" />
                    </button>
                  </div>
                  <div className="tb-table-wrap">
                    <table className="tb-table">
                      <thead>
                        <tr>
                          <th>Model Name</th>
                          <th>Type</th>
                          <th>Accuracy</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MODEL_REGISTRY.map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td>{row.type}</td>
                            <td>{row.accuracy}</td>
                            <td>
                              <span className={`an-status-pill an-status-pill--${statusTone(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td>
                              <button type="button" className="an-table-view" >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default AnalyticsPage;