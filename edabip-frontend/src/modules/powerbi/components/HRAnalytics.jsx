import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext';

import DashboardSidebar from '../../dashboard/components/DashboardSidebar';
import AppFooter from "../../../components/common/AppFooter/index.jsx";
import AnalyticsTabs from '../components/AnalyticsTabs/AnalyticsTabs.jsx';
import HRAnalyticsSkeleton from './HRAnalyticsSkeleton.jsx';
import '../../dashboard/pages/DashboardPage.css';
import './HRAnalytics.css';

import {
  ENGAGEMENT_DATA,
  DIVERSITY_DATA,
  DIVERSITY_MAX,
  DIVERSITY_YLABELS,
  linePathPoints,
  linePathDots,
} from './HRAnalyticsCharts';

// TOPBAR

import SearchIcon from '../../../assets/dashboard/search.svg';
import NotificationsIcon from '../../../assets/dashboard/notifications.svg';
import SearchClear from '../../../assets/dashboard/charts/search-clear.svg';
import AvatarMark from '../../../assets/dashboard/charts/avatar.svg';

// HEADER

import ExportIcon from '../../../assets/dashboard/powerbi/card-assests/Export-Icon.svg';
import LastRefreshIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';

// KPI CARD ICONS

import TotalHeadCount from '../../../assets/dashboard/powerbi/card-assests/TotalHeadcount.svg';
import TurnOverRate from '../../../assets/dashboard/powerbi/card-assests/TurnoverRate.svg';
import EnpsScoreIcon from '../../../assets/dashboard/powerbi/card-assests/EnpsScore.svg';
import TimeToHireIcon from '../../../assets/dashboard/powerbi/card-assests/TimeToHire.svg';

import GraphIcon from '../../../assets/dashboard/powerbi/card-assests/Graph.svg';
import LineGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Line-graph.svg';

import UpArrowgreenIcon from '../../../assets/dashboard/powerbi/card-assests/UpArrow-green.svg';
import UpArrowredIcon from '../../../assets/dashboard/powerbi/card-assests/UpArrow-red.svg';
import DownArrowgreenIcon from '../../../assets/dashboard/powerbi/card-assests/DownArrow-green.svg';
import BackArrowIcon from '../../../assets/dashboard/powerbi/card-assests/BackArrow.svg';

import SharedPeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';

function PeriodDropdown({ id, value, onSelect }) {
  return (
    <SharedPeriodDropdown
      value={value}
      onChange={(newVal) => onSelect(id, newVal)}
    />
  );
}

/* -------------------------------------------------- */
/* Diversity bar chart constants                       */
/* -------------------------------------------------- */

const DIVERSITY_CAP_PX = 14;


const DIVERSITY_LABEL_GAP_PX = 3;

/* -------------------------------------------------- */
/* Engagement Score Trend chart geometry                */
/* -------------------------------------------------- */

const LINE_CHART_VIEW_W = 600;
const LINE_CHART_VIEW_H = 200;
const LINE_CHART_LEFT_GAP = 14;
const LINE_CHART_RIGHT_PAD = 12;
const LINE_CHART_TOP_PAD = 12;
const LINE_CHART_BOTTOM_PAD = 12;
const LINE_CHART_LEFT_INSET = 20;
const LINE_CHART_PLOT_START = LINE_CHART_LEFT_GAP + LINE_CHART_LEFT_INSET;

const LINE_CHART_DRAW_W =
  LINE_CHART_VIEW_W - LINE_CHART_PLOT_START - LINE_CHART_RIGHT_PAD;
const LINE_CHART_DRAW_H =
  LINE_CHART_VIEW_H - LINE_CHART_TOP_PAD - LINE_CHART_BOTTOM_PAD;

const ENGAGEMENT_LINE_PATH = linePathPoints(
  ENGAGEMENT_DATA.values,
  LINE_CHART_DRAW_W,
  LINE_CHART_DRAW_H,
  ENGAGEMENT_DATA.yMax
);

const ENGAGEMENT_LINE_DOTS = linePathDots(
  ENGAGEMENT_DATA.values,
  LINE_CHART_DRAW_W,
  LINE_CHART_DRAW_H,
  ENGAGEMENT_DATA.yMax
);

const ENGAGEMENT_GRID_ROWS = ENGAGEMENT_DATA.yLabels.map((label) => ({
  label,
  y:
    LINE_CHART_TOP_PAD +
    LINE_CHART_DRAW_H -
    (label / ENGAGEMENT_DATA.yMax) * LINE_CHART_DRAW_H,
}));

const ENGAGEMENT_LABEL_POSITIONS = ENGAGEMENT_DATA.xLabels.map(
  (label, index) => ({
    label,
    leftPct:
      ((LINE_CHART_PLOT_START +
        (index / (ENGAGEMENT_DATA.xLabels.length - 1)) * LINE_CHART_DRAW_W) /
        LINE_CHART_VIEW_W) *
      100,
  })
);

const ENGAGEMENT_GRID_COLS = ENGAGEMENT_DATA.xLabels.map((label, index) => ({
  label,
  x:
    LINE_CHART_PLOT_START +
    (index / (ENGAGEMENT_DATA.xLabels.length - 1)) * LINE_CHART_DRAW_W,
}));

/* -------------------------------------------------- */
/* Component                                           */
/* -------------------------------------------------- */

function HRAnalytics() {
  const { logout } = useAuthContext();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);

  const [search, setSearch] = useState('');

  const [periods, setPeriods] = useState({
    engagement: 'Last 6 Months',
    diversity: 'Last 6 Months',
  });

  const handleDropdownSelect = (id, value) => {
    setPeriods((prev) => ({ ...prev, [id]: value }));
  };

  /* ------------------------------------------------ */
  /* Logout                                           */
  /* ------------------------------------------------ */

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ------------------------------------------------ */
  /* Render                                            */
  /* ------------------------------------------------ */

  return (
    <div className="db-page hr-page">
      {/* SIDEBAR */}

      <DashboardSidebar onLogout={handleLogout} />

      {/* MAIN CONTENT */}

      <div className="db-main">
        {/* TOPBAR */}

        <header className="db-topbar">
          <div className="db-search">
            <img src={SearchIcon} alt="" className="db-search__icon" />

            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search ? (
              <button
                type="button"
                className="db-search__clear"
                onClick={() => setSearch('')}
              >
                <img src={SearchClear} alt="" />
              </button>
            ) : (
              <img
                src={SearchClear}
                alt=""
                className="db-search__clear-icon"
              />
            )}
          </div>

          <div className="db-topbar__actions">
            <button type="button" className="db-topbar__bell">
              <img src={NotificationsIcon} alt="" />
            </button>

            <div className="db-topbar__avatar">
              <img src={AvatarMark} alt="" />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="db-content hr-content">
          {/* PAGE HEADER */}

          <div className="hr-header">
            <div className="hr-title-row">
              <button
                type="button"
                className="hr-back-btn"
                onClick={() => navigate('/powerbi')}
                aria-label="Back to Power BI"
              >
                <img
                  src={BackArrowIcon}
                  alt=""
                  className="hr-back-icon"
                />
              </button>

              <h1>HR Analytics</h1>
            </div>

            <div className="hr-header__right">
              <div className="hr-refresh">
                <img src={LastRefreshIcon} alt="" />
                <span>Last Refreshed : 2h ago</span>
              </div>

              <button type="button" className="db-btn db-btn--solid">
                <img src={ExportIcon} alt="" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* ANALYTICS TABS */}

          <AnalyticsTabs
            navClassName="hr-tabs"
            tabClassName="hr-tab"
            activeTabClassName="hr-tab--active"
          />

          {isLoading ? (
            <HRAnalyticsSkeleton />
          ) : (
            <>
            {/* KPI CARDS */}

            <div className="hr-kpi-grid">
              {/* TOTAL HEADCOUNT */}

              <div className="hr-kpi-card">
                <div className="hr-kpi-card__top">
                  <div className="hr-kpi-heading">
                    <div className="hr-kpi-icon">
                      <img src={TotalHeadCount} alt="" />
                    </div>

                    <h5>Total Headcount</h5>
                  </div>
                </div>

                <div className="hr-kpi-card__bottom">
                  <div className="hr-kpi-value-row">
                    <h3>4,821</h3>

                    <img
                      src={GraphIcon}
                      alt=""
                      className="hr-kpi-graph-icon"
                    />
                  </div>

                  <div className="hr-kpi-badge badge-green">
                    <img src={UpArrowgreenIcon} alt="" />
                    <span>+2.4% vs last period</span>
                  </div>
                </div>
              </div>

              {/* TURNOVER RATE */}

              <div className="hr-kpi-card">
                <div className="hr-kpi-card__top">
                  <div className="hr-kpi-heading">
                    <div className="hr-kpi-icon">
                      <img src={TurnOverRate} alt="" />
                    </div>

                    <h5>Turnover Rate</h5>
                  </div>
                </div>

                <div className="hr-kpi-card__bottom">
                  <div className="hr-kpi-value-row">
                    <h3>8.5%</h3>

                    <img
                      src={LineGraphIcon}
                      alt=""
                      className="hr-kpi-graph-icon"
                    />
                  </div>

                  <div className="hr-kpi-badge badge-red">
                    <img src={UpArrowredIcon} alt="" />
                    <span>+0.8% vs last period</span>
                  </div>
                </div>
              </div>

              {/* ENPS SCORE */}

              <div className="hr-kpi-card">
                <div className="hr-kpi-card__top">
                  <div className="hr-kpi-heading">
                    <div className="hr-kpi-icon">
                      <img src={EnpsScoreIcon} alt="" />
                    </div>

                    <h5>ENPS Score</h5>
                  </div>
                </div>

                <div className="hr-kpi-card__bottom">
                  <div className="hr-kpi-value-row">
                    <h3>42</h3>

                    <img
                      src={GraphIcon}
                      alt=""
                      className="hr-kpi-graph-icon"
                    />
                  </div>

                  <div className="hr-kpi-badge badge-darkgreen">
                    <img src={UpArrowgreenIcon} alt="" />
                    <span>-3.1% vs last quarter</span>
                  </div>
                </div>
              </div>

              {/* TIME TO HIRE */}

              <div className="hr-kpi-card">
                <div className="hr-kpi-card__top">
                  <div className="hr-kpi-heading">
                    <div className="hr-kpi-icon">
                      <img src={TimeToHireIcon} alt="" />
                    </div>

                    <h5>Time To Hire (Avg)</h5>
                  </div>
                </div>

                <div className="hr-kpi-card__bottom">
                  <div className="hr-kpi-value-row">
                    <h3>34 Days</h3>

                    <img
                      src={GraphIcon}
                      alt=""
                      className="hr-kpi-graph-icon"
                    />
                  </div>

                  <div className="hr-kpi-badge badge-lightgreen">
                    <img src={DownArrowgreenIcon} alt="" />
                    <span>-3 days vs last period</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="hr-chart-grid">
              {/* ENGAGEMENT SCORE TREND */}

              <div className="hr-chart-card">
                <div className="hr-chart-card__header">
                  <h3>Engagement Score Trend</h3>

                  <PeriodDropdown
                    id="engagement"
                    value={periods.engagement}
                    onSelect={handleDropdownSelect}
                  />
                </div>

                <div className="hr-chart-wrapper">
                  <div className="hr-line-chart__yaxis">
                    {ENGAGEMENT_GRID_ROWS.map((row) => (
                      <span
                        key={row.label}
                        style={{
                          top: `${(row.y / LINE_CHART_VIEW_H) * 100}%`,
                        }}
                      >
                        {row.label === 0 ? '0' : `$${row.label / 1000}K`}
                      </span>
                    ))}
                  </div>

                  <div className="hr-line-chart-area">
                    <svg
                      className="hr-line-chart"
                      viewBox={`0 0 ${LINE_CHART_VIEW_W} ${LINE_CHART_VIEW_H}`}
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Engagement score trend"
                    >
                      {ENGAGEMENT_GRID_ROWS.map((row) => (
                        <line
                          key={`h-${row.label}`}
                          className="hr-chart-grid-line"
                          x1={LINE_CHART_LEFT_GAP}
                          x2={LINE_CHART_VIEW_W - LINE_CHART_RIGHT_PAD}
                          y1={row.y}
                          y2={row.y}
                        />
                      ))}

                      {ENGAGEMENT_GRID_COLS.map((col) => (
                        <line
                          key={`v-${col.label}`}
                          className="hr-chart-grid-line"
                          x1={col.x}
                          x2={col.x}
                          y1={LINE_CHART_TOP_PAD}
                          y2={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H}
                        />
                      ))}

                      {/* SOLID Y AXIS LINE */}
                      <line
                        className="hr-chart-axis-line"
                        x1={LINE_CHART_LEFT_GAP}
                        x2={LINE_CHART_LEFT_GAP}
                        y1={LINE_CHART_TOP_PAD}
                        y2={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H}
                      />

                      {/* SOLID X AXIS LINE */}
                      <line
                        className="hr-chart-axis-line"
                        x1={LINE_CHART_LEFT_GAP}
                        x2={LINE_CHART_VIEW_W - LINE_CHART_RIGHT_PAD}
                        y1={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H}
                        y2={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H}
                      />

                      {/* Y AXIS TICK MARKS */}
                      {ENGAGEMENT_GRID_ROWS.map((row) => (
                        <line
                          key={`ytick-${row.label}`}
                          className="hr-chart-tick-line"
                          x1={LINE_CHART_LEFT_GAP - 5}
                          x2={LINE_CHART_LEFT_GAP}
                          y1={row.y}
                          y2={row.y}
                        />
                      ))}

                      {/* X AXIS TICK MARKS */}
                      {ENGAGEMENT_GRID_COLS.map((col) => (
                        <line
                          key={`xtick-${col.label}`}
                          className="hr-chart-tick-line"
                          x1={col.x}
                          x2={col.x}
                          y1={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H}
                          y2={LINE_CHART_TOP_PAD + LINE_CHART_DRAW_H + 5}
                        />
                      ))}

                      <g
                        transform={`translate(${LINE_CHART_PLOT_START}, ${LINE_CHART_TOP_PAD})`}
                      >
                        <path
                          d={ENGAGEMENT_LINE_PATH}
                          fill="none"
                          stroke="#134B4A"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {ENGAGEMENT_LINE_DOTS.map((dot, index) => (
                          <circle
                            key={ENGAGEMENT_DATA.xLabels[index]}
                            cx={dot.x}
                            cy={dot.y}
                            r="3.5"
                            fill="#2E7D7A"
                            stroke="#134B4A"
                            strokeWidth="2"
                          />
                        ))}
                      </g>
                    </svg>

                    <div className="hr-line-chart__xaxis">
                      {ENGAGEMENT_LABEL_POSITIONS.map((item) => (
                        <span
                          key={item.label}
                          style={{ left: `${item.leftPct}%` }}
                        >
                          {item.label}
                        </span>
                      ))}
                    </div>

                    <div className="hr-line-chart__axis-title">Month</div>
                  </div>
                </div>
              </div>

              {/* DIVERSITY BY DEPARTMENT */}

              <div className="hr-chart-card">
                <div className="hr-chart-card__header">
                  <h3>Diversity By Department</h3>

                  <PeriodDropdown
                    id="diversity"
                    value={periods.diversity}
                    onSelect={handleDropdownSelect}
                  />
                </div>

                <div className="hr-barchart-wrapper">
                  <div className="hr-barchart-yaxis">
                    {DIVERSITY_YLABELS.map((v) => (
                      <span
                        key={v}
                        style={{
                          top: `${100 - (v / DIVERSITY_MAX) * 100}%`,
                        }}
                      >
                        {v === 0 ? '0' : `${v / 1000}K`}
                      </span>
                    ))}
                  </div>

                  <div className="hr-bar-chart-area">
                    <div className="hr-bar-chart-plot">
                      <div className="hr-bar-chart-grid">
                        {DIVERSITY_YLABELS.map((v) => (
                          <div
                            key={v}
                            className="hr-bar-chart-grid__line"
                            style={{ bottom: `${(v / DIVERSITY_MAX) * 100}%` }}
                          />
                        ))}
                      </div>

                      <div className="hr-bar-chart-axis-line hr-bar-chart-axis-line--y" />
                      <div className="hr-bar-chart-axis-line hr-bar-chart-axis-line--x" />

                      {DIVERSITY_YLABELS.map((v) => (
                        <div
                          key={`ytick-${v}`}
                          className="hr-bar-chart-tick-line"
                          style={{ bottom: `${(v / DIVERSITY_MAX) * 100}%` }}
                        />
                      ))}

                      <div className="hr-bar-chart">
                      {DIVERSITY_DATA.map((dept) => {
                        const valuePct = (dept.value / DIVERSITY_MAX) * 100;

                        return (
                          <div className="hr-bar-chart__col" key={dept.label}>
                            <div className="hr-bar-chart__track">
                              <span
                                className="hr-bar-chart__value"
                                style={{
                                  bottom: `calc(${valuePct}% + ${
                                    DIVERSITY_CAP_PX + DIVERSITY_LABEL_GAP_PX
                                  }px)`,
                                }}
                              >
                                {dept.value.toLocaleString()}
                              </span>
                              <div
                                className="hr-bar-chart__bar-bg"
                                style={{
                                  height: `calc(${valuePct}% + ${DIVERSITY_CAP_PX}px)`,
                                  background: dept.bgColor,
                                }}
                              />

                              <div
                                className="hr-bar-chart__bar"
                                style={{
                                  height: `${valuePct}%`,
                                  background: dept.color,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>

                    <div className="hr-bar-chart__labels-row">
                      {DIVERSITY_DATA.map((dept) => (
                        <span className="hr-bar-chart__label" key={dept.label}>
                          {dept.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              
              </div>
            </div>
            </>
          )}
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default HRAnalytics;