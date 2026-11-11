import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthContext } from "../../../context/AuthContext.jsx";
import DashboardSidebar from "../../dashboard/components/DashboardSidebar.jsx";
import TopBar from "../../../components/layout/TopBar/index.jsx";
import "../../dashboard/pages/DashboardPage.css";
import "./Sales-Analytics.css";
import SalesAnalyticsSkeleton from "./SalesAnalyticsSkeleton.jsx";
import AnalyticsTabs from '../components/AnalyticsTabs/AnalyticsTabs.jsx';
// import { getSalesAnalyticsData } from '../api/salesAnalyticsApi.js';


import WorldMapImg from "../../../assets/dashboard/powerbi/card-assests/World-Map.svg";
import SparkGraphImg from "../../../assets/dashboard/powerbi/card-assests/Graph.svg";
import GrowthGraphImg from "../../../assets/dashboard/powerbi/card-assests/Line-graph.svg";
import TotalRevenue from "../../../assets/dashboard/powerbi/card-assests/Bar-graph.svg";

import SalesGrowth from "../../../assets/dashboard/powerbi/card-assests/finance.svg";
import ActiveCustomers from "../../../assets/dashboard/customers.svg";
import ProfitMargin from "../../../assets/dashboard/revenue.svg";
import Clock from "../../../assets/dashboard/powerbi/last-refreshed.svg";
// import RefreshIcon from "../../../assets/dashboard/powerbi/refresh.svg";
import ExportIcon from "../../../assets/dashboard/powerbi/card-assests/Export-Icon.svg";

import ArrowLeftIcon from "../../../assets/dashboard/powerbi/card-assests/BackArrow.svg";
// plain black arrow — used for the "info" badge (Active Customers), which
// gets its own blue background rather than the green/red up/down colors
import TrendingUpIcon from "../../../assets/dashboard/powerbi/card-assests/UpArrow-black.svg";
// positive/negative stat-change badges use the green/red arrows, matching
// Financial Analytics 
import TrendingDownIcon from "../../../assets/dashboard/powerbi/card-assests/DownArrow-black.svg";
import ChevronDownIcon from "../../../assets/dashboard/powerbi/chevron-down.svg";
import AppFooter from "../../../components/common/AppFooter/index.jsx";
import ExportMenu from "../../../components/common/ExportMenu/index.jsx";
import PeriodDropdown from "../../../components/common/PeriodDropdown/index.jsx";



// paths match routeConfig.js's registered routes for each report
// const TABS = [
//   { label: "Sales Analytics", path: "/powerbi/sales-analytics" },
//   { label: "Financial Analytics", path: "/powerbi/report/financial" },
//   { label: "Customer Analytics", path: "/powerbi/report/customer" },
//   { label: "HR Analytics", path: "/powerbi/report/hr" },
//   { label: "Operations Analytics", path: "/powerbi/report/operations" },
// ];



// [current, previous] revenue (in $000s) per day, Day 1 - Day 7
const DAILY_TREND = [
  { day: "Day 1", current: 5000, previous: 0 },
  { day: "Day 1", current: 9000, previous: 10000 },

  { day: "Day 2", current: 9000, previous: 12000 },
  { day: "Day 2", current: 18000, previous: 12000 },

  { day: "Day 3", current: 15000, previous: 10000 },
  { day: "Day 3", current: 9000, previous: 16000 },

  { day: "Day 4", current: 13000, previous: 13000 },
  { day: "Day 4", current: 13000, previous: 5000 },

  { day: "Day 5", current: 20000, previous: 4000 },
  { day: "Day 5", current: 21000, previous: 15000 },

  { day: "Day 6", current: 8000, previous: 11000 },
  { day: "Day 6", current: 21000, previous: 25000 },

  { day: "Day 7", current: 19000, previous: 26000 },
  { day: "Day 7", current: 24000, previous: 32000 },
];

const MONTHLY_REVENUE = [
  { month: "Jan", value: 28, total: 45 },
  { month: "Feb", value: 18, total: 20 },
  { month: "Mar", value: 29, total: 45 },
  { month: "Apr", value: 13, total: 42 },
  { month: "May", value: 13, total: 52 },
  { month: "Jun", value: 45, total: 48 },
  { month: "Jul", value: 26, total: 28 },
  { month: "Aug", value: 32, total: 50 },
  { month: "Sep", value: 21, total: 38 },
  { month: "Oct", value: 38, total: 55 },
  { month: "Nov", value: 24, total: 44 },
  { month: "Dec", value: 41, total: 60 },
];

const REGIONS = [
  { name: "New York", value: "72K", x: 20, y: 38 },
  { name: "San Francisco", value: "39K", x: 27, y: 45 },
  { name: "Sydney", value: "25K", x: 78, y: 78 },
  { name: "Singapore", value: "61K", x: 70, y: 61 },
];

const TOP_REPS = [
  { name: "Sarah Jenkins", revenue: "$840k" },
  { name: "Marcus Reed", revenue: "$720k" },
  { name: "Emma Lin", revenue: "$695k" },
  { name: "Sarah Jenkins", revenue: "$840k" },
  { name: "Marcus Reed", revenue: "$720k" },
  { name: "Emma Lin", revenue: "$695k" },
  { name: "Sarah Jenkins", revenue: "$840k" },
];

function getSalesAnalyticsData() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dailyTrend: DAILY_TREND,
        monthlyRevenue: MONTHLY_REVENUE,
        regions: REGIONS,
        topReps: TOP_REPS,
      });
    }, 750);
  });
}

function DailyTrendChart() {
  const width = 700;
  const height = 90;

  const padTop = 10;
  const padBottom = 6;
  const padLeft = 8;

  /*
   * These paths are intentionally fixed to reproduce
   * the curve shape from the Figma design.
   *
   * Scale:
   * 0K  -> bottom
   * 10K -> 1/3
   * 20K -> 2/3
   * 30K -> top
   */

  // CURRENT — solid dark teal
  const currentPath = `
    M 8,72

    C 22,68 34,61 50,58
    C 62,58 74,58 88,58

    C 94,58 99,55 103,48
    C 108,39 112,35 119,34

    C 134,37 150,42 168,48
    C 181,52 195,57 209,55

    C 223,52 237,47 251,45
    C 265,45 279,45 293,45

    C 299,45 302,42 305,36
    C 308,30 313,28 320,27

    C 334,25 347,24 360,22
    C 371,21 380,27 389,34

    C 400,42 410,49 420,57
    C 427,62 433,66 440,61

    C 449,54 457,45 466,37
    C 472,32 478,28 484,28

    C 500,30 516,33 532,35
    C 540,36 547,34 554,31

    C 562,28 570,25 578,22

    C 590,21 602,20 614,19
    C 628,18 642,17 656,16
    C 668,15 681,14 692,13
  `;

  // PREVIOUS — dotted light teal
  const previousPath = `
    M 8,84

    C 18,78 30,69 42,62
    C 53,58 64,55 76,54

    C 89,53 101,52 113,52

    C 125,53 137,55 149,58

    C 162,61 175,65 188,62
    C 201,58 214,52 227,47

    C 239,42 251,37 263,34

    C 276,38 288,44 301,52

    C 313,60 326,66 339,67

    C 352,68 365,68 378,68

    C 389,68 400,68 411,69

    C 421,62 431,53 441,46
    C 451,39 461,35 471,37

    C 481,39 491,42 501,45
    C 511,48 521,50 531,48

    C 539,46 546,41 551,35

    C 556,27 560,19 568,17

    C 584,15 601,15 617,15
    C 634,14 650,13 666,10
    C 676,8 685,5 692,2
  `;

  const ticks = [0, 10000, 20000, 30000];

  const pointY = (value) => {
    const niceMax = 30000;

    return (
      padTop +
      (height - padTop - padBottom) *
      (1 - value / niceMax)
    );
  };

  return (
    <div className="sa-trend-chart-box">
      <svg
        className="sa-trend-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {/* Horizontal grid lines */}
        {ticks.map((tick) => (
          <line
            key={tick}
            x1={padLeft}
            x2={width}
            y1={pointY(tick)}
            y2={pointY(tick)}
            className="sa-grid-line"
          />
        ))}

        {/* Previous */}
        <path
          d={previousPath}
          className="sa-line-previous"
          fill="none"
        />

        {/* Current */}
        <path
          d={currentPath}
          className="sa-line-current"
          fill="none"
        />
      </svg>

      {/* Y-axis labels */}
      <div className="sa-trend-y-labels">
        <span
          className="sa-y-tick-label-html"
          style={{ top: "11%" }}
        >
          30K
        </span>

        <span
          className="sa-y-tick-label-html"
          style={{ top: "37%" }}
        >
          20K
        </span>

        <span
          className="sa-y-tick-label-html"
          style={{ top: "63%" }}
        >
          10K
        </span>

        <span
          className="sa-y-tick-label-html"
          style={{ top: "94%" }}
        >
          0
        </span>
      </div>


      {/* X-axis labels */}
      <div className="sa-trend-x-labels">
        <span className="sa-axis-label-html" style={{ left: "5%" }}>
          Day 1
        </span>

        <span className="sa-axis-label-html" style={{ left: "19.5%" }}>
          Day 2
        </span>

        <span className="sa-axis-label-html" style={{ left: "34%" }}>
          Day 3
        </span>

        <span className="sa-axis-label-html" style={{ left: "48.5%" }}>
          Day 4
        </span>

        <span className="sa-axis-label-html" style={{ left: "63%" }}>
          Day 5
        </span>

        <span className="sa-axis-label-html" style={{ left: "77.5%" }}>
          Day 6
        </span>

        <span className="sa-axis-label-html" style={{ left: "92%" }}>
          Day 7
        </span>
      </div>
    </div>
  );
}

function MonthlyBarChart({ data }) {
  const width = 700;
  const height = 250;
  const padBottom = 4;
  const padTop = 14;
  const padLeft = 20;
  const maxScale = 100;
  const slot = (width - padLeft) / data.length;
  const barWidth = slot / 2.6;
  const chartHeight = height - padBottom - padTop;
  const yTicks = [0, 25, 50, 75, 100];

  const centerX = (i) => padLeft + slot * i + slot / 2;

  return (
    <div className="sa-bar-chart-box">
      <svg
        className="sa-bar-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        overflow="visible"
      >
        <defs>
          <linearGradient id="sa-bar-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a98bf0" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#a98bf0" stopOpacity="1" />
            <stop offset="100%" stopColor="#6d4fd1" stopOpacity="1" />
          </linearGradient>
          <pattern id="sa-bar-stripes" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="4" height="4" fill="#efe9fc" />
            <line x1="0" y1="0" x2="0" y2="4" stroke="#c9b8f2" strokeWidth="1.4" />
          </pattern>
        </defs>

        <line x1={0} x2={0} y1={0} y2={padTop + chartHeight} className="sa-y-axis-line" />
        <line
          x1={0}
          x2={width}
          y1={padTop + chartHeight}
          y2={padTop + chartHeight}
          className="sa-x-axis-line"
        />

        {yTicks.map((t) => {
          const y = padTop + chartHeight * (1 - t / maxScale);
          return (
            <g key={t}>
              {t !== 0 && (
                <line x1={0} x2={width} y1={y} y2={y} className="sa-grid-line-dashed" />
              )}
              <line x1={-5} x2={0} y1={y} y2={y} className="sa-y-axis-tick" />
            </g>
          );
        })}

        {data.map((d, i) => {
          const x = centerX(i) - barWidth / 2;
          const totalHeight = chartHeight * (d.total / maxScale);
          const valueHeight = chartHeight * (d.value / maxScale);
          const yTotal = padTop + chartHeight - totalHeight;
          const yValue = padTop + chartHeight - valueHeight;

          return (
            <g key={d.month}>
              <rect x={x} y={yTotal} width={barWidth} height={totalHeight} rx={5} ry={5} fill="url(#sa-bar-stripes)" />
              <rect x={x} y={yValue} width={barWidth} height={valueHeight} rx={5} ry={5} fill="url(#sa-bar-gradient)" />
            </g>
          );
        })}

        {data.map((d, i) => {
          const totalHeight = chartHeight * (d.total / maxScale);
          const yTotal = padTop + chartHeight - totalHeight;
          return (
            <text
              key={`label-${d.month}`}
              x={centerX(i)}
              y={yTotal - 8}
              textAnchor="middle"
              className="sa-bar-value-label"
            >
              {(d.total * 1000).toLocaleString()}
            </text>
          );
        })}
      </svg>

      <div className="sa-bar-y-labels">
        {yTicks.map((t) => {
          const y = padTop + chartHeight * (1 - t / maxScale);
          const topPct = (y / height) * 100;
          return (
            <span
              key={t}
              className="sa-y-tick-label-html"
              style={{ top: `${topPct}%` }}
            >
              {t === 0 ? "0" : `${t}K`}
            </span>
          );
        })}
      </div>

      <div className="sa-bar-x-labels">
        {data.map((d, i) => {
          const leftPct = (centerX(i) / width) * 100;
          return (
            <span key={d.month} className="sa-axis-label-html" style={{ left: `${leftPct}%` }}>
              {d.month}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function WorldMapCard({ regions }) {
  const maxValue = Math.max(...regions.map((r) => Number.parseInt(r.value, 10)));

  return (
    <div className="sa-map-wrap">
      <div className="sa-map-img-wrap">
        <img src={WorldMapImg} alt="Sales by region map" className="sa-map-img" />

        {regions.map((r) => (
          <span
            key={r.name}
            className="sa-map-dot"
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          />
        ))}
      </div>

      <div className="sa-map-legend">
        {regions.map((r) => {
          const pct = (Number.parseInt(r.value, 10) / maxValue) * 92;
          return (
            <div className="sa-map-legend-item" key={r.name}>
              <span className="sa-map-legend-text">
                {r.name} <strong>{r.value}</strong>
              </span>
              <span className="sa-map-legend-bar-track">
                <span
                  className="sa-map-legend-bar"
                  style={{ width: `${pct}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function monthCountFromRange(monthRange) {
  if (typeof monthRange === 'number') return monthRange;
  const match = [3, 6, 9, 12].find((count) => String(monthRange).includes(String(count)));
  return match ?? 6;
}

export default function SalesAnalytics() {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const [monthRange, setMonthRange] = useState('Last 6 Months');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);

    getSalesAnalyticsData()
      .then((data) => {
        if (!active) return;
        setAnalytics(data);
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const monthlyRevenue = analytics?.monthlyRevenue || [];
  const regions = analytics?.regions || [];
  const topReps = analytics?.topReps || [];
  const chartData = monthlyRevenue.slice(-monthCountFromRange(monthRange));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  let analyticsMain = (
    <>
              {/* stat cards */}
              <div className="sa-stats-grid">
                <article className="sa-stat-card">
                  <div className="sa-stat-top">
                    <span className="sa-stat-icon">
                      <img src={TotalRevenue} alt="" />
                    </span>
                    <h2 className="sa-stat-label">Total Revenue</h2>
                  </div>
                  <div className="sa-stat-body">
                    <p className="sa-stat-value">$4.2M</p>
                    <img src={SparkGraphImg} alt="" className="sa-stat-graph-img" />
                  </div>
                  <span className="sa-stat-change sa-change-up">
                    <img src={TrendingUpIcon} alt="" width="12" height="12" />
                    <span>+12% vs last month</span>
                  </span>
                </article>

                <article className="sa-stat-card">
                  <div className="sa-stat-top">
                    <span className="sa-stat-icon">
                      <img src={SalesGrowth} alt="" />
                    </span>
                    <h2 className="sa-stat-label">Sales Growth</h2>
                  </div>
                  <div className="sa-stat-body">
                    <p className="sa-stat-value">8.5%</p>
                    <img src={GrowthGraphImg} alt="" className="sa-stat-graph-img" />
                  </div>
                  <span className="sa-stat-change sa-change-up">
                    <img src={TrendingUpIcon} alt="" width="12" height="12" />
                    <span>+12% vs last month</span>
                  </span>
                </article>

                <article className="sa-stat-card">
                  <div className="sa-stat-top">
                    <span className="sa-stat-icon">
                      <img src={ActiveCustomers} alt="" />
                    </span>
                    <h2 className="sa-stat-label">Active Customers</h2>
                  </div>
                  <div className="sa-stat-body">
                    <p className="sa-stat-value">1,250</p>
                    <img src={SparkGraphImg} alt="" className="sa-stat-graph-img" />
                  </div>
                  <span className="sa-stat-change sa-change-info">
                    <img src={TrendingUpIcon} alt="" width="12" height="12" />
                    <span>+45 new this week</span>
                  </span>
                </article>

                <article className="sa-stat-card">
                  <div className="sa-stat-top">
                    <span className="sa-stat-icon">
                      <img src={ProfitMargin} alt="" />
                    </span>
                    <h2 className="sa-stat-label">Profit Margin</h2>
                  </div>
                  <div className="sa-stat-body">
                    <p className="sa-stat-value">24%</p>
                    <img src={SparkGraphImg} alt="" className="sa-stat-graph-img" />
                  </div>
                  <span className="sa-stat-change sa-change-down">
                    <img src={TrendingDownIcon} alt="" width="12" height="12" />
                    <span>-2% vs last quarter</span>
                  </span>
                </article>
              </div>

              {/* daily sales trend */}
              <section className="sa-card sa-trend-card">
                <div className="sa-card-head">
                  <h2>Daily Sales Trend</h2>
                </div>

                <div className="sa-trend-chart-wrap">
                  <span className="sa-y-axis-label">Revenue (USD)</span>
                  <DailyTrendChart data={analytics?.dailyTrend || DAILY_TREND} />
                </div>

                <div className="sa-trend-footer">
                  <div className="sa-legend">
                    <span className="sa-legend-item">
                      <span className="sa-legend-dot sa-legend-dot-current" />
                      <span>Current</span>
                    </span>
                    <span className="sa-legend-item">
                      <span className="sa-legend-dot sa-legend-dot-previous" />
                      <span>Previous</span>
                    </span>
                  </div>
                  <span className="sa-x-axis-label">Days</span>
                </div>
              </section>

              {/* bottom row */}
              <div className="sa-bottom-grid">
                <section className="sa-card sa-monthly-card">
                  <div className="sa-card-head">
                    <h2>Monthly Revenue Trends</h2>
                    <PeriodDropdown
                      value={monthRange}
                      onChange={setMonthRange}
                      ariaLabel="Select monthly revenue trends period"
                    />
                  </div>
                  <div className="sa-bar-chart-wrap">
                    <span className="sa-y-axis-label">Active User Count</span>
                    <MonthlyBarChart data={chartData} />
                  </div>
                  <div className="sa-bar-chart-footer">
                    <span className="sa-x-axis-label">Days</span>
                  </div>
                </section>

                <section className="sa-card sa-region-card">
                  <div className="sa-card-head">
                    <h2>Sales by Region</h2>
                  </div>
                  <WorldMapCard regions={regions} />
                </section>

                <section className="sa-card sa-reps-card">
                  <div className="sa-card-head">
                    <h2>Top Reps</h2>
                    <span className="sa-view-all">
                      <span>View All</span>
                      <img src={ChevronDownIcon} alt="" className="sa-icon-12" />
                    </span>
                  </div>

                  <div className="sa-reps-table-box">
                    <table className="sa-reps-table">
                      <thead>
                        <tr>
                          <th>Rep Name</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topReps.map((rep, i) => (
                          <tr key={`${rep.name}-${i}`}>
                            <td>{rep.name}</td>
                            <td>{rep.revenue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
              <AppFooter />
    </>
  );

  if (isLoading) {
    analyticsMain = <SalesAnalyticsSkeleton />;
  } else if (loadError) {
    analyticsMain = (
      <p className="sa-error-message">
        Couldn&apos;t load sales analytics right now. Please try refreshing the page.
      </p>
    );
  }

  return (
    <div className="db-page pbi-page sa-page">
      <DashboardSidebar onLogout={handleLogout} />

      <div className="db-main">
        <TopBar />

        <div className="db-content sa-content">
          <div className="sa-header">
            <button
              type="button"
              className="sa-back-btn"
              onClick={() => navigate("/powerbi")}
              aria-label="Back to Power BI"
            >
              <img src={ArrowLeftIcon} alt="" className="sa-back-icon" />
            </button>
            <h1 className="sa-title">Sales Analytics</h1>

            <div className="sa-header-actions">
              <span className="sa-refreshed">
                <img src={Clock} alt="" className="sa-clock-icon" />
                <span>Last Refreshed: 2h ago</span>
              </span>
              <ExportMenu
                iconSrc={ExportIcon}
                buttonClassName="sa-export-btn"
                filename="sales-analytics"
                title="Sales Analytics"
                columns={[
                  { key: 'name', label: 'Rep Name' },
                  { key: 'revenue', label: 'Revenue' },
                ]}
                rows={TOP_REPS}
              />
            </div>
          </div>

          <AnalyticsTabs />
          {analyticsMain}
        </div>
      </div>
    </div>
  );
}