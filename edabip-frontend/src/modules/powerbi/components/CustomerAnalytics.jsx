import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import CustomerAnalyticsSkeleton from './CustomerAnalyticsSkeleton.jsx';
import { getCustomerAnalyticsData } from '../api/CustomerAnalyticsApi.js';
import AnalyticsTabs from '../components/AnalyticsTabs/AnalyticsTabs.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './CustomerAnalytics.css';

import BackArrow from '../../../assets/dashboard/powerbi/card-assests/BackArrow.svg';
import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import BarGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Bar-graph.svg';
import ArrowGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Arrow-graph.svg';
import Timer from '../../../assets/dashboard/powerbi/card-assests/Timer.svg';
import CustomersTileIcon from '../../../assets/dashboard/customers.svg';
import GraphSparkline from '../../../assets/dashboard/powerbi/card-assests/Graph.svg';
import LineGraphSparkline from '../../../assets/dashboard/powerbi/card-assests/Line-graph.svg';
import UpArrowGreen from '../../../assets/dashboard/powerbi/card-assests/UpArrow-green.svg';
import DownArrowRed from '../../../assets/dashboard/powerbi/card-assests/DownArrow-red.svg';
import UpArrowBlack from '../../../assets/dashboard/powerbi/card-assests/UpArrow-black.svg';
import DownArrowBlack from '../../../assets/dashboard/powerbi/card-assests/DownArrow-black.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import ExportIcon from "../../../assets/dashboard/analytics/export-icon.svg";

// maps the icon keys stored in the API response to the actual imported assets
const ICON_MAP = {
  'bar-graph': BarGraphIcon,
  'arrow-graph': ArrowGraphIcon,
  'customers-tile': CustomersTileIcon,
  timer: Timer,
};

const SPARK_MAP = {
  graph: GraphSparkline,
  'line-graph': LineGraphSparkline,
};

const BADGE_ICON_MAP = {
  'up-green': UpArrowGreen,
  'down-red': DownArrowRed,
  'up-black': UpArrowBlack,
  'down-black': DownArrowBlack,
};

// function ExportIcon() {
//   return (
//     <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
//       <path
//         d="M8 1.5v8.6M8 1.5 5 4.6M8 1.5l3 3.1M2 10.2v2.8c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-2.8"
//         stroke="#fff"
//         strokeWidth="1.4"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }

function buildSmoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

// const TABS = [
//   { id: 'sales', label: 'Sales Analytics' },
//   { id: 'financial', label: 'Financial Analytics' },
//   { id: 'customer', label: 'Customer Analytics' },
//   { id: 'hr', label: 'HR Analytics' },
//   { id: 'operations', label: 'Operations Analytics' },
// ];

const ACQUISITION_TICKS = [0, 25, 50, 75, 100];

// same options/behavior as the working dropdown on the Tableau screen
const PERIOD_OPTIONS = ['Last 3 Months', 'Last 6 Months', 'Last 9 Months', 'Last 12 Months'];

// reuses DashboardCharts.jsx's line-chart markup/classes
function RetentionTrendsChart({ points: retentionPoints }) {
  const width = 760;
  const height = 200;
  const pad = { top: 14, right: 12, bottom: 6, left: 6 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yTicks = [100, 75, 50, 25, 0];
  const max = 100;

  const points = retentionPoints.map((p, i) => {
    const x = pad.left + (i / (retentionPoints.length - 1)) * plotW;
    const y = pad.top + (1 - p.value / max) * plotH;
    return { ...p, x, y };
  });

  const path = buildSmoothPath(points);

  return (
    <div className="db-chart db-chart--svg ca-chart--retention">
      <div className="db-chart__body">
        <div
          className="db-chart__y-axis"
          style={{ paddingTop: pad.top, paddingBottom: pad.bottom + 18 }}
          aria-hidden="true"
        >
          {yTicks.map((t) => (
            <span key={t}>{t === 0 ? '$0' : `$${t}K`}</span>
          ))}
        </div>
        <div className="db-chart__frame">
          <svg
            className="db-chart__svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-label="Retention trends from January to September"
          >
            {yTicks.map((t) => {
              const y = pad.top + (1 - t / max) * plotH;
              return (
                <line
                  key={`h-${t}`}
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  className="db-chart__grid"
                />
              );
            })}
            {points.map((p) => (
              <line
                key={`v-${p.month}`}
                x1={p.x}
                y1={pad.top}
                x2={p.x}
                y2={pad.top + plotH}
                className="db-chart__grid"
              />
            ))}

            {/* Fix 2: solid axis line + tick marks, matches Figma */}
            <line
              x1={pad.left}
              y1={pad.top}
              x2={pad.left}
              y2={pad.top + plotH}
              className="db-chart__axis-line"
            />
            <line
              x1={pad.left}
              y1={pad.top + plotH}
              x2={width - pad.right}
              y2={pad.top + plotH}
              className="db-chart__axis-line"
            />
            {yTicks.map((t) => {
              const y = pad.top + (1 - t / max) * plotH;
              return (
                <line
                  key={`tick-${t}`}
                  x1={pad.left - 4}
                  y1={y}
                  x2={pad.left}
                  y2={y}
                  className="db-chart__axis-tick"
                />
              );
            })}

            <path d={path} className="db-chart__line-path" fill="none" />
            {points.map((p) => (
              <circle key={p.month} cx={p.x} cy={p.y} r="4.5" className="db-chart__dot" />
            ))}
          </svg>
          <div className="db-chart__x-axis">
            {retentionPoints.map((p) => (
              <span key={p.month}>{p.month}</span>
            ))}
          </div>
        </div>
      </div>
      <span className="db-chart__x-label">Month</span>
    </div>
  );
}

function AcquisitionPerformanceChart({ bars }) {
  // ticks placed by exact % so "0" lands on the real baseline
  const tickCount = ACQUISITION_TICKS.length;

  return (
    <div className="ca-chart-body ca-chart-body--bars">
      <div className="ca-bar-chart">
        <div className="ca-bar-chart__grid" aria-hidden="true">
          {ACQUISITION_TICKS.slice()
            .reverse()
            .map((t, i) => (
              <div
                className="ca-bar-chart__row"
                key={t}
                style={{ top: `${(i / (tickCount - 1)) * 100}%` }}
              >
                <span className="ca-chart__tick">{t === 0 ? '0' : `${t}K`}</span>
                <span className="ca-bar-chart__line" />
              </div>
            ))}
        </div>
        <div className="ca-bar-chart__axis" aria-hidden="true" />
        <div className="ca-bar-chart__cols">
          {bars.map((bar) => (
            <div className="ca-bar-col" key={bar.key}>
              <span
                className="ca-bar-col__value"
                style={{ bottom: `calc(${bar.value}% + 0px)` }}
              >
                {bar.displayValue}
              </span>
              <div className="ca-bar-col__track">
                <div
                  className="ca-bar-col__bar"
                  style={{ height: `${bar.value}%`, background: bar.color }}
                />
              </div>
              <span className="ca-bar-col__label">{bar.key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// same responsive-width hook used by FinancialAnalytics' canvas charts
function useElementWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

// Canvas-based donut, same approach as FinancialAnalytics' ExpenseDonutChart:
// ctx.arc() with butt caps + a small angular gap, instead of SVG
// strokeDasharray/rotate (avoids round-cap bleed math entirely).

// purely cosmetic — nudges each arc's visual sweep away from its real
// data % without changing the legend/center numbers shown to the user.
// Kept as two positive-only maps (boost/reduce) instead of signed numbers.
const SEGMENT_VISUAL_BOOST = {
  ENT: 10,
};
const SEGMENT_VISUAL_REDUCE = {
  MID: 10,
  SMB: 0,
};

// positive-degree offset, subtracted from the start angle to spin the
// whole ring counter-clockwise ("left") to match Figma
const ROTATION_OFFSET_DEG = 32;
const ROTATION_OFFSET_RAD = (ROTATION_OFFSET_DEG * Math.PI) / 180;

function CustomerSegmentsDonut({ segments, centerValue }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const measuredWidth = useElementWidth(containerRef);
  const size = Math.max(180, Math.min(260, measuredWidth || 260));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const strokeWidth = size * 0.16;
    const radius = size / 2 - strokeWidth / 2 - 2;
    const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
    // Flat (butt) caps don't extend past the trimmed endpoint, so the gap
    // angle maps directly to the visible pixel gap along the ring.
    ctx.lineCap = 'round';
    const visibleGapPx = 8;
    const gapAngle = visibleGapPx / radius;

    let angle = -Math.PI / 2 - ROTATION_OFFSET_RAD;
    segments.forEach((segment) => {
      const boost = SEGMENT_VISUAL_BOOST[segment.label] || 0;
      const reduce = SEGMENT_VISUAL_REDUCE[segment.label] || 0;
      const biasedValue = Math.max(segment.value + boost - reduce, 0);
      const sweep = (biasedValue / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.strokeStyle = segment.color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'butt';
      ctx.arc(cx, cy, radius, angle + gapAngle / 2, angle + sweep - gapAngle / 2);
      ctx.stroke();
      angle += sweep;
    });
  }, [size, segments]);

  return (
    <div className="ca-donut-wrap" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="ca-donut-canvas"
        aria-label="Customer segments breakdown"
      />
      <div className="ca-donut-center">
        <span className="ca-donut-center__pct">{centerValue}%</span>
        <span className="ca-donut-center__label">Enterprise</span>
      </div>
    </div>
  );
}
import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';


function CustomerAnalytics() {
  const { logout, user } = useAuthContext();
  const navigate = useNavigate();
  const [retentionPeriod, setRetentionPeriod] = useState(PERIOD_OPTIONS[1]);
  const [acquisitionPeriod, setAcquisitionPeriod] = useState(PERIOD_OPTIONS[1]);
  const [segmentsPeriod, setSegmentsPeriod] = useState(PERIOD_OPTIONS[1]);

  // Data fetched from customerAnalyticsApi.js (kpis, retention, acquisition, segments)
  const [analyticsData, setAnalyticsData] = useState(null);

  // Controls the skeleton loader shown while the Customer Analytics
  // report/data is being fetched (e.g. right after navigating here from
  // the "View Report" button on the Power BI page).
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCustomerAnalyticsData()
      .then((data) => {
        if (!active) return;
        setAnalyticsData(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useMemo(() => {
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Alin';
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/powerbi');
  };

  if (isLoading) {
    return (
      <div className="db-page ca-page">
        <DashboardSidebar onLogout={handleLogout} />
        <div className="db-main">
          <TopBar />
          <div className="db-content ca-content">
            <CustomerAnalyticsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const kpis = analyticsData?.kpis || [];
  const retention = analyticsData?.retention || [];
  const acquisition = analyticsData?.acquisition || [];
  const segments = analyticsData?.segments || [];
  const lastRefreshed = analyticsData?.lastRefreshed || '—';

  return (
    <div className="db-page ca-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content ca-content">
          <section className="ca-header">
            <div className="ca-header__left">
              <button type="button" className="ca-back" aria-label="Go back" onClick={handleBack}>
                <img src={BackArrow} alt="" width="14" height="14" />
              </button>
              <h1 className="ca-header__title">Customer Analytics</h1>
            </div>

            <div className="ca-header__meta">
              <img src={LastRefreshedIcon} alt="" width="18" height="18" />
              <span>Last Refreshed: {lastRefreshed}</span>
            </div>

          <button type="button" className="ca-export-btn">
                <img src={ExportIcon} alt="Export" />
                <span>Export</span>
            </button>

          </section>

          {/* <nav className="ca-tabs" aria-label="Analytics categories">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`ca-tab${tab.id === 'customer' ? ' ca-tab--active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav> */}
          <AnalyticsTabs
            as="nav"
            ariaLabel="Analytics categories"
            navClassName="ca-tabs"
            tabClassName="ca-tab"
            activeTabClassName="ca-tab--active"
          />
          <section className="db-kpi-grid ca-kpis" aria-label="Customer analytics KPIs">
            {kpis.map((kpi) => (
              <article className="db-kpi-card ca-kpi-card" key={kpi.id}>
                <div className="ca-kpi-card__head">
                  <img
                    className="db-kpi-card__icon ca-kpi-card__icon"
                    src={ICON_MAP[kpi.icon]}
                    alt=""
                    width="40"
                    height="42"
                  />
                  <h2 className="ca-kpi-card__label">{kpi.label}</h2>
                </div>

                <div className="ca-kpi-card__body">
                  <span className="ca-kpi-card__value">{kpi.value}</span>
                  <span className="ca-kpi-card__spark">
                    <img src={SPARK_MAP[kpi.spark]} alt="" className="ca-kpi-card__spark-img" />
                  </span>
                </div>

                <span className={`ca-kpi-card__badge ca-kpi-card__badge--${kpi.badge.type}`}>
                  {kpi.badge.icon ? (
                  <img src={BADGE_ICON_MAP[kpi.badge.icon]} alt="" width="11" height="11" />
                  ) : null}
                  {kpi.badge.text}
                </span>
              </article>
            ))}
          </section>

          <section className="db-charts-row ca-charts-row" aria-label="Retention and acquisition charts">
            <article className="db-card ca-chart-card ca-chart-card--retention">
              <div className="ca-chart-card__head">
                <h3 className="ca-chart-card__title">Retention Trends</h3>
                <PeriodDropdown
                  value={retentionPeriod}
                  onChange={setRetentionPeriod}
                  ariaLabel="Select retention period"
                />
              </div>
              <RetentionTrendsChart points={retention} />
            </article>

            <article className="db-card ca-chart-card ca-chart-card--acquisition">
              <div className="ca-chart-card__head">
                <h3 className="ca-chart-card__title">Acquisition performance</h3>
                <PeriodDropdown
                  value={acquisitionPeriod}
                  onChange={setAcquisitionPeriod}
                  ariaLabel="Select acquisition period"
                />
              </div>
              <AcquisitionPerformanceChart bars={acquisition} />
            </article>
          </section>

          <section className="ca-segments" aria-label="Customer segments">
            <article className="db-card ca-chart-card ca-segments-card">
              <div className="ca-chart-card__head">
                <h3 className="ca-chart-card__title">Customer Segments</h3>
                <PeriodDropdown
                  value={segmentsPeriod}
                  onChange={setSegmentsPeriod}
                  ariaLabel="Select segments period"
                />
              </div>

              <div className="ca-segments-card__body">
                <CustomerSegmentsDonut segments={segments} centerValue={analyticsData?.segmentsCenterValue ?? 0} />

                <div className="ca-legend">
                 {segments.map((segment) => (
                <span
                 key={segment.label}
                 className="ca-legend__chip"
                 style={{ borderColor: segment.color }}
                >
                 <span className="ca-legend__chip-label">{segment.label}</span>
                 <span className="ca-legend__chip-value">{segment.value}%</span>
                 </span>
                 ))}
                </div>
              </div>
            </article>
          </section>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default CustomerAnalytics;