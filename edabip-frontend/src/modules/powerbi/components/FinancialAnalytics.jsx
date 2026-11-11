import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';
import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './FinancialAnalytics.css';
import AnalyticsTabs from '../components/AnalyticsTabs/AnalyticsTabs.jsx';
import FinancialAnalyticsSkeleton from './FinancialAnalyticsSkeleton.jsx';

import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import BackArrow from '../../../assets/dashboard/powerbi/card-assests/BackArrow.svg';
import BarGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Bar-graph.svg';
import FinanceIcon from '../../../assets/dashboard/powerbi/card-assests/finance.svg';
import GraphIcon from '../../../assets/dashboard/powerbi/card-assests/Graph.svg';
import LineGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Line-graph.svg';
import UpArrowBlack from '../../../assets/dashboard/powerbi/card-assests/UpArrow-black.svg';
import DownArrowRed from '../../../assets/dashboard/powerbi/card-assests/DownArrow-red.svg';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';
import ExportIcon from '../../../assets/dashboard/powerbi/card-assests/Export-Icon.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';
import LockBox from '../../../assets/dashboard/powerbi/card-assests/lockbox.svg';
import Stat from '../../../assets/dashboard/powerbi/card-assests/stat.svg';
import PeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';

// import LoadTrend from '../../../assets/dashboard/powerbi/card-assests/LoadTrend.svg'

// const TABS = [
//   { id: 'sales', label: 'Sales Analytics' },
//   { id: 'financial', label: 'Financial Analytics' },
//   { id: 'customer', label: 'Customer Analytics' },
//   { id: 'hr', label: 'HR Analytics' },
//   { id: 'operations', label: 'Operations Analytics' },
// ];

const KPI_CARDS = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$4.2M',
    change: '+12%',
    trend: 'up',
    note: 'vs last month',
    icon: BarGraphIcon,
    sparkImage: GraphIcon,
  },
  {
    id: 'profit',
    label: 'Net Profit',
    value: '$850K',
    change: '+12%',
    trend: 'up',
    note: 'vs last month',
    icon: FinanceIcon,
    sparkImage: LineGraphIcon,
  },
  {
    id: 'expenses',
    label: 'Operating Expenses',
    value: '$2.1M',
    change: '-3.1%',
    trend: 'down',
    note: 'vs last quarter',
    icon: Stat,
    sparkImage: GraphIcon,
  },
  {
    id: 'cashflow',
    label: 'Cash Flow',
    value: '$1.1M',
    change: '+5.4%',
    trend: 'up',
    note: 'vs last quarter',
    icon: LockBox,
    sparkImage: GraphIcon,
  },
];


const REVENUE_EXPENSE_POINTS = [
  { month: 'Jan', revenue: 27, expenses: 25 },
  { month: 'Feb', revenue: 34, expenses: 26 },
  { month: 'Mar', revenue: 30, expenses: 25 },
  { month: 'Apr', revenue: 47, expenses: 21 },
  { month: 'May', revenue: 54, expenses: 21 },
  { month: 'Jun', revenue: 50, expenses: 49 },
  { month: 'Jul', revenue: 62, expenses: 36 },
  { month: 'Aug', revenue: 74, expenses: 34 },
  { month: 'Sep', revenue: 80, expenses: 98 },
];

const EXPENSE_BREAKDOWN = [
  { id: 'rnd', label: 'R&D', percent: 45, arcWeight: 55, color: '#134b4a' },
  { id: 'marketing', label: 'Marketing', percent: 30, arcWeight: 15, color: '#3E9593' },
  { id: 'operating', label: 'Operating', percent: 25, arcWeight: 30, color: '#77FFFD' },
];

const MAX_REVENUE_EXPENSE = 100;

const REVENUE_COLOR = '#134b4a';
const EXPENSE_LINE_COLOR = '#a7d8d6';

const REVENUE_LINE_WIDTH = 2.5;
const EXPENSE_LINE_WIDTH = 1.6;

const EXPENSE_DASH = [5, 5];

// Single source of truth for the plot's inner padding. Used by the canvas
// drawing code and the x-axis label positions so both always line up on the
// same coordinate grid.
const CHART_PAD = { top: 14, right: 12, bottom: 6, left: 6 };

const FIRST_POINT_INSET_RATIO = 0.03;

function getDataInsetLeft(width) {
  const plotW = width - CHART_PAD.left - CHART_PAD.right;
  return plotW * FIRST_POINT_INSET_RATIO;
}


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

const REVENUE_EXPENSE_Y_TICKS = [100, 75, 50, 25, 0];

function drawSmoothLine(ctx, points, color, dashPattern, lineWidth) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.setLineDash(dashPattern || []);
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    ctx.bezierCurveTo(cx, p0.y, cx, p1.y, p1.x, p1.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDots(ctx, points, color) {
  points.forEach((p) => {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function RevenueExpenseChart() {
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const measuredWidth = useElementWidth(frameRef);
  const width = measuredWidth || 640;
  const height = Math.max(200, Math.min(260, Math.round(width * (240 / 640))));

  const dataInsetLeft = getDataInsetLeft(width);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = CHART_PAD;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const insetLeft = getDataInsetLeft(width);

    const toPoints = (key) =>
      REVENUE_EXPENSE_POINTS.map((p, i) => ({
        x: pad.left + insetLeft + (i / (REVENUE_EXPENSE_POINTS.length - 1)) * (plotW - insetLeft),
        y: pad.top + (1 - p[key] / MAX_REVENUE_EXPENSE) * plotH,
      }));

    const revenuePoints = toPoints('revenue');
    const expensePoints = toPoints('expenses');

    ctx.strokeStyle = '#e8ecec';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    REVENUE_EXPENSE_Y_TICKS.forEach((t) => {
      const y = pad.top + (1 - t / MAX_REVENUE_EXPENSE) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    });
    revenuePoints.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.x, pad.top);
      ctx.lineTo(p.x, pad.top + plotH);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    ctx.strokeStyle = '#d7dde0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    ctx.lineTo(width - pad.right, pad.top + plotH);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.stroke();


    drawSmoothLine(ctx, expensePoints, EXPENSE_LINE_COLOR, EXPENSE_DASH, EXPENSE_LINE_WIDTH);

    drawSmoothLine(ctx, revenuePoints, REVENUE_COLOR, null, REVENUE_LINE_WIDTH);
    drawDots(ctx, revenuePoints, REVENUE_COLOR);
  }, [width, height]);

  return (
    <div className="fa-line-chart">
      <span className="fa-line-chart__y-label">Revenue (USD)</span>

      <div className="fa-line-chart__body">
        <div className="fa-line-chart__y-axis" aria-hidden="true">
          {REVENUE_EXPENSE_Y_TICKS.map((t) => (
            <span key={t}>{t === 0 ? '0' : `$${t}K`}</span>
          ))}
        </div>

        <div className="fa-line-chart__frame" ref={frameRef}>
          <canvas
            ref={canvasRef}
            className="fa-line-chart__canvas"
            aria-label="Revenue versus expenses, year to date"
          />

          <div className="fa-line-chart__x-axis">
            {REVENUE_EXPENSE_POINTS.map((p, i) => {
              const plotW = width - CHART_PAD.left - CHART_PAD.right;
              const frac =
                REVENUE_EXPENSE_POINTS.length > 1
                  ? i / (REVENUE_EXPENSE_POINTS.length - 1)
                  : 0;
              const leftPx =
                CHART_PAD.left + dataInsetLeft + frac * (plotW - dataInsetLeft);
              const isFirst = i === 0;
              const isLast = i === REVENUE_EXPENSE_POINTS.length - 1;

              return (
                <span
                  key={p.month}
                  className="fa-line-chart__x-label"
                  style={{
                    left: `${leftPx}px`,
                    transform: isFirst
                      ? 'translateX(0)'
                      : isLast
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                  }}
                >
                  {p.month}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fa-line-chart__legend">
        <span className="fa-line-chart__legend-item fa-line-chart__legend-item--revenue">
          <span className="fa-line-chart__legend-dot fa-line-chart__legend-dot--revenue" />
          <span className="fa-line-chart__legend-label">Revenue</span>
        </span>
        <span className="fa-line-chart__legend-item fa-line-chart__legend-item--expenses">
          <span className="fa-line-chart__legend-dot fa-line-chart__legend-dot--expenses" />
          <span className="fa-line-chart__legend-label">Expenses</span>
        </span>
      </div>
    </div>
  );
}

function ExpenseDonutChart() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const measuredWidth = useElementWidth(containerRef);
  const size = Math.max(160, Math.min(220, measuredWidth || 220));

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
    const strokeWidth = size * 0.17;
    const radius = size / 2 - strokeWidth / 2 - 2;
    const total = EXPENSE_BREAKDOWN.reduce(
      (sum, slice) => sum + (slice.arcWeight ?? slice.percent),
      0
    );
    
    const visibleGapPx = 5;
    const gapAngle = visibleGapPx / radius;

    let angle = -Math.PI / 2 - Math.PI / 5;
    EXPENSE_BREAKDOWN.forEach((slice) => {
      const sweep = ((slice.arcWeight ?? slice.percent) / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'butt';
      ctx.arc(cx, cy, radius, angle + gapAngle / 2, angle + sweep - gapAngle / 2);
      ctx.stroke();
      angle += sweep;
    });
  }, [size]);

  return (
    <div className="fa-donut">
      <div className="fa-donut__chart" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="fa-donut__canvas"
          aria-label="Expense breakdown by category"
        />
        <div className="fa-donut__center">
          <strong>240</strong>
          <span>Total Expense</span>
        </div>
      </div>

      <ul className="fa-donut__legend">
        {EXPENSE_BREAKDOWN.map((slice) => {
          return (
            <li
              key={slice.id}
              className="fa-donut__legend-item"
              style={{ borderColor: slice.color }}
            >
              <span className="fa-donut__legend-label">{slice.label}</span>
              <strong>{slice.percent} %</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FinancialAnalytics() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="db-page fa-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content fa-content">
          <section className="fa-header">
            <div className="fa-header__title">
              <button
                type="button"
                className="fa-back-btn"
                onClick={() => navigate('/powerbi')}
                aria-label="Back to Power BI"
              >
                <img src={BackArrow} alt="" width="18" height="18" />
              </button>
              <h1>Financial Analytics</h1>
            </div>

            <div className="fa-header__actions">
              <span className="fa-last-refreshed">
                <img src={LastRefreshedIcon} alt="" width="16" height="16" />
                <span>Last Refreshed: 2h ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon}
                iconClassName="fa-export-btn__icon"
                iconWidth={16}
                iconHeight={16}
                buttonClassName="db-btn db-btn--solid fa-export-btn"
                label={<span className="fa-export-btn__text">Export</span>}
                filename="financial-analytics"
                title="Financial Analytics"
                columns={[
                  { key: 'label', label: 'Metric' },
                  { key: 'value', label: 'Value' },
                  { key: 'change', label: 'Change' },
                ]}
                rows={KPI_CARDS}
              />
            </div>
          </section>

          <AnalyticsTabs
            as="nav"
            ariaLabel="Analytics categories"
            navClassName="fa-tabs"
            tabClassName="fa-tab"
            activeTabClassName="fa-tab--active"
          />

          {loading ? (
            <FinancialAnalyticsSkeleton />
          ) : (
            <>
              <section className="fa-kpi-grid">
                {KPI_CARDS.map((card) => (
                  <article key={card.id} className="fa-kpi-card">
                    <div className="fa-kpi-card__header">
                      <span className="fa-kpi-card__icon">
                        <img src={card.icon} alt="" width="54" height="56" />
                      </span>
                      <h2>{card.label}</h2>
                    </div>

                    <div className="fa-kpi-card__row">
                      <p className="fa-kpi-card__value">{card.value}</p>
                      <img src={card.sparkImage} alt="" className="fa-kpi-card__spark" />
                    </div>

                    <span className={`fa-kpi-card__badge fa-kpi-card__badge--${card.trend}`}>
                      <img
                        src={card.trend === 'up' ? UpArrowBlack : DownArrowRed}
                        alt=""
                        width="12"
                        height="12"
                      />
                      {card.change} {card.note}
                    </span>
                  </article>
                ))}
              </section>

              <section className="fa-charts-row">
                <article className="db-card fa-chart-card">
                  <div className="db-card__header">
                    <h3>Revenue vs Expenses (YTD)</h3>
                    <PeriodDropdown />
                  </div>
                  <RevenueExpenseChart />
                </article>

                <article className="db-card fa-chart-card">
                  <div className="db-card__header">
                    <h3>Expense Breakdown</h3>
                    <PeriodDropdown />
                  </div>
                  <ExpenseDonutChart />
                </article>
              </section>
              <AppFooter />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialAnalytics;