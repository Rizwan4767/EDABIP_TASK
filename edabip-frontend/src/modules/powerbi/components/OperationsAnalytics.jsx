import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/AuthContext.jsx';

import DashboardSidebar from '../../dashboard/components/DashboardSidebar.jsx';
import TopBar from '../../../components/layout/TopBar/index.jsx';
import AnalyticsTabs from '../components/AnalyticsTabs/AnalyticsTabs.jsx';

import '../../dashboard/pages/DashboardPage.css';
import './OperationsAnalytics.css';

import OperationsAnalyticsSkeleton from './OperationsAnalyticsSkeleton.jsx';
import ExportIcon from '../../../assets/dashboard/powerbi/card-assests/Export-Icon.svg';

import LastRefreshedIcon from '../../../assets/dashboard/powerbi/last-refreshed.svg';
import BackArrowIcon from '../../../assets/dashboard/powerbi/card-assests/BackArrow.svg';
import HealthStatusIcon from '../../../assets/dashboard/powerbi/card-assests/Health.svg';
import SparkGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Graph.svg';
import LineGraphIcon from '../../../assets/dashboard/powerbi/card-assests/Line-graph.svg';
import ChevronDownIcon from '../../../assets/dashboard/powerbi/chevron-down.svg';
import UpArrowIcon from '../../../assets/dashboard/powerbi/card-assests/UpArrow-black.svg';
import DownArrowIcon from '../../../assets/dashboard/powerbi/card-assests/DownArrow-black.svg';
import AppFooter from '../../../components/common/AppFooter/index.jsx';

import ActiveIncidentsIcon from '../../../assets/dashboard/powerbi/card-assests/Arrow-graph.svg';
import AvgResponseTimeIcon from '../../../assets/dashboard/powerbi/card-assests/ops-icon.svg';

import RevenueTrendLine from '../../../assets/dashboard/charts/revenue-trend-line.svg';
import CpuLoadTrendLine from '../../../assets/dashboard/powerbi/card-assests/LoadTrend.svg';
import ExportMenu from '../../../components/common/ExportMenu/index.jsx';

import ClockReload from '../../../assets/dashboard/powerbi/card-assests/clockreload.svg';
import Security from '../../../assets/dashboard/powerbi/card-assests/security.svg';

const APPLICATION_HEALTH = [
  { id: 1, name: 'ERP System', meta: 'v4.2.1 - Global', status: 'Healthy' },
  { id: 2, name: 'CRM Platform', meta: 'v2.1.0 - EMEA/APAC', status: 'Healthy' },
  { id: 3, name: 'HRIS Portal', meta: 'v1.9.4 - NA', status: 'Critical' },
  { id: 4, name: 'ERP System', meta: 'v4.2.1 - Global', status: 'Healthy' },
  { id: 5, name: 'CRM Platform', meta: 'v2.1.0 - EMEA/APAC', status: 'Healthy' },
];

const SYSTEM_PERFORMANCE = {
  responseTime: [100, 117, 108, 145, 158, 148, 172, 197, 210],
  cpuLoad: [85, 70, 65, 70, 95, 148, 130, 205, 245],
  xLabels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00', '28:00', '32:00'],
  yLabels: [250, 200, 150, 100, 0],
  yMax: 250,
};

const SERVER_LOAD = [
  { label: 'North America', value: 65000, color: '#A9B8ED' },
  { label: 'EMEA', value: 95000, color: '#7EB2F0' },
  { label: 'APAC', value: 55000, color: '#6BE6D3' },
];

const SERVER_LOAD_MAX = 100000;
const SERVER_LOAD_YLABELS = [100000, 75000, 50000, 25000, 0];

const INCIDENT_DATA = [
  { label: 'Infrastructure', percent: 50, color: '#134B4A' },
  { label: 'Network', percent: 25, color: '#3E9593' },
  { label: 'Security', percent: 25, color: '#77FFFD' },
];

const TOTAL_INCIDENTS = 240;

/* -------------------------------------------------- */
/* Health Filter Dropdown ("View All") */
/* -------------------------------------------------- */
const HEALTH_FILTER_OPTIONS = ['View All', 'Healthy', 'Critical'];

function HealthFilterDropdown({ value, isOpen, onToggle, onSelect }) {
  return (
    <div className="oa-dropdown">
      <button
        type="button"
        className="oa-panel__source oa-panel__source--button"
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {value}
        <img
          src={ChevronDownIcon}
          alt=""
          className={`oa-chevron${isOpen ? ' oa-chevron--open' : ''}`}
          width="10"
          height="7"
        />
      </button>

      {isOpen && (
        <ul className="oa-dropdown__menu" role="listbox">
          {HEALTH_FILTER_OPTIONS.map((option) => (
            <li key={option} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`oa-dropdown__item${option === value ? ' oa-dropdown__item--active' : ''}`}
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
import SharedPeriodDropdown from '../../../components/common/PeriodDropdown/index.jsx';

function PeriodDropdown({ id, value, onSelect }) {
  return (
    <SharedPeriodDropdown
      value={value}
      onChange={(newVal) => onSelect(id, newVal)}
    />
  );
}


function getRoundedArcPath(cx, cy, rOut, rIn, startAngle, endAngle, cornerRadius) {
  const a1 = (startAngle * Math.PI) / 180;
  const a2 = (endAngle * Math.PI) / 180;

  const dOut = cornerRadius / rOut;
  const dIn = cornerRadius / rIn;

  const a1o = a1 + dOut;
  const a2o = a2 - dOut;
  const a1i = a1 + dIn;
  const a2i = a2 - dIn;

  const x1o = cx + rOut * Math.cos(a1o);
  const y1o = cy + rOut * Math.sin(a1o);
  const x2o = cx + rOut * Math.cos(a2o);
  const y2o = cy + rOut * Math.sin(a2o);

  const x2i = cx + rIn * Math.cos(a2i);
  const y2i = cy + rIn * Math.sin(a2i);
  const x1i = cx + rIn * Math.cos(a1i);
  const y1i = cy + rIn * Math.sin(a1i);

  const x1o_cap = cx + (rOut - cornerRadius) * Math.cos(a1);
  const y1o_cap = cy + (rOut - cornerRadius) * Math.sin(a1);
  const x1i_cap = cx + (rIn + cornerRadius) * Math.cos(a1);
  const y1i_cap = cy + (rIn + cornerRadius) * Math.sin(a1);

  const x2o_cap = cx + (rOut - cornerRadius) * Math.cos(a2);
  const y2o_cap = cy + (rOut - cornerRadius) * Math.sin(a2);
  const x2i_cap = cx + (rIn + cornerRadius) * Math.cos(a2);
  const y2i_cap = cy + (rIn + cornerRadius) * Math.sin(a2);

  const largeArcOuter = (a2o - a1o) > Math.PI ? 1 : 0;
  const largeArcInner = (a2i - a1i) > Math.PI ? 1 : 0;

  return `
    M ${x1o} ${y1o}
    A ${rOut} ${rOut} 0 ${largeArcOuter} 1 ${x2o} ${y2o}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${x2o_cap} ${y2o_cap}
    L ${x2i_cap} ${y2i_cap}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${x2i} ${y2i}
    A ${rIn} ${rIn} 0 ${largeArcInner} 0 ${x1i} ${y1i}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${x1i_cap} ${y1i_cap}
    L ${x1o_cap} ${y1o_cap}
    A ${cornerRadius} ${cornerRadius} 0 0 1 ${x1o} ${y1o}
    Z
  `.replace(/\s+/g, ' ').trim();
}

/* -------------------------------------------------- */
/* Component                                           */
/* -------------------------------------------------- */

function OperationsAnalytics() {
  const { logout } = useAuthContext();

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState('View All');

  const handleHealthFilterSelect = (value) => {
    setHealthFilter(value);
    setOpenDropdown(null);
  };
  const [periods, setPeriods] = useState({
    performance: 'Last 6 Months',
    server: 'Last 6 Months',
    incident: 'Last 6 Months',
  });

  const [openDropdown, setOpenDropdown] = useState(null);

  const dropdownWrapperRef = useRef(null);

  const handleDropdownToggle = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const handleDropdownSelect = (id, value) => {
    setPeriods((prev) => ({ ...prev, [id]: value }));
    setOpenDropdown(null);
  };

  useEffect(() => {
    if (!openDropdown) return undefined;

    const handleClickOutside = (event) => {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) setLoading(false);
    }, 750);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);
  /* ------------------------------------------------ */
  /* Logout                                           */
  /* ------------------------------------------------ */

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  /* ------------------------------------------------ */
  /* Back                                             */
  /* ------------------------------------------------ */

  const handleBack = () => {
    navigate('/powerbi');
  };

  /* ------------------------------------------------ */
  /* Chart Configuration                              */
  /* ------------------------------------------------ */

  const chartWidth = 640;
  const chartHeight = 200;



  const filteredHealth =
    healthFilter === 'View All'
      ? APPLICATION_HEALTH
      : APPLICATION_HEALTH.filter((item) => item.status === healthFilter);

  /* ------------------------------------------------ */
  /* Render                                            */
  /* ------------------------------------------------ */

  return (
    <div className="db-page pbi-page operational-page">
      {/* -------------------------------------------- */}
      {/* Sidebar                                      */}
      {/* -------------------------------------------- */}

      <DashboardSidebar
        onLogout={handleLogout}
      />

      {/* -------------------------------------------- */}
      {/* Main                                         */}
      {/* -------------------------------------------- */}

      <div className="db-main">
        <TopBar />

        {/* ------------------------------------------ */}
        {/* Content                                    */}
        {/* ------------------------------------------ */}

        <div className="db-content pbi-content operational-content" ref={dropdownWrapperRef}>

          {/* ---------------------------------------- */}
          {/* Page Header                              */}
          {/* ---------------------------------------- */}

          <div className="oa-headrow">
            <button
              type="button"
              className="oa-back"
              onClick={handleBack}
            >
              <img
                src={BackArrowIcon}
                alt=""
                width="20"
                height="20"
              />

              <span>
                Operations Analytics
              </span>
            </button>

            <div className="oa-headrow__right">
              <span className="oa-lastrefreshed">
                <img
                  src={LastRefreshedIcon}
                  alt=""
                  width="16"
                  height="16"
                />
                <span>Last Refreshed: 2h ago</span>
              </span>

              <ExportMenu
                iconSrc={ExportIcon}
                iconWidth={16}
                iconHeight={16}
                buttonClassName="oa-export"
                filename="operations-analytics"
                title="Operations Analytics"
                columns={[
                  { key: 'name', label: 'Application' },
                  { key: 'meta', label: 'Details' },
                  { key: 'status', label: 'Status' },
                ]}
                rows={APPLICATION_HEALTH}
              />
            </div>
          </div>

          {/* ---------------------------------------- */}
          {/* Analytics Tabs                           */}
          {/* ---------------------------------------- */}
          <AnalyticsTabs
            as="nav"
            ariaLabel="Analytics tabs"
            navClassName="oa-tabs"
            tabClassName="oa-tab"
            activeTabClassName="oa-tab--active"
          />

          {/* ---------------------------------------- */}
          {/* KPI Cards                                */}
          {/* ---------------------------------------- */}
          {loading ? (
            <OperationsAnalyticsSkeleton />
          ) : (
            <>
              <section className="oa-kpis" aria-label="Key metrics">
                <article className="oa-kpi-card">
                  <div className="oa-kpi-card__head">
                    <img src={ClockReload} alt="" width="40" height="40" />
                    <span className="oa-kpi-card__label">System Up Time</span>
                  </div>

                  <div className="oa-kpi-card__middle">
                    <div className="oa-kpi-card__value">99.9%</div>
                    <img src={SparkGraphIcon} alt="" className="oa-kpi-card__graph" />
                  </div>

                  <span className="oa-kpi-card__trend oa-kpi-card__trend--up">
                    <img src={UpArrowIcon} alt="" width="10" height="10" />
                    <span>+12% vs last month</span>
                  </span>
                </article>

                <article className="oa-kpi-card">
                  <div className="oa-kpi-card__head">
                    <img src={ActiveIncidentsIcon} alt="" width="40" height="40" />
                    <span className="oa-kpi-card__label">Active Incidents</span>
                  </div>

                  <div className="oa-kpi-card__middle">
                    <div className="oa-kpi-card__value">12</div>
                    <img src={LineGraphIcon} alt="" className="oa-kpi-card__graph" />
                  </div>

                  <span className="oa-kpi-card__trend oa-kpi-card__trend--down">
                    <img src={DownArrowIcon} alt="" width="10" height="10" />
                    <span>+0.3% vs last month</span>
                  </span>
                </article>

                <article className="oa-kpi-card">
                  <div className="oa-kpi-card__head">
                    <img src={AvgResponseTimeIcon} alt="" width="40" height="40" />
                    <span className="oa-kpi-card__label">Avg Response Time</span>
                  </div>

                  <div className="oa-kpi-card__middle">
                    <div className="oa-kpi-card__value">180MS</div>
                    <img src={SparkGraphIcon} alt="" className="oa-kpi-card__graph" />
                  </div>

                  <span className="oa-kpi-card__trend oa-kpi-card__trend--neutral">
                    <img src={UpArrowIcon} alt="" width="10" height="10" />
                    <span>+45 new this week</span>
                  </span>
                </article>

                <article className="oa-kpi-card">
                  <div className="oa-kpi-card__head">
                    <img src={Security} alt="" width="40" height="40" />
                    <span className="oa-kpi-card__label">Security Compliance</span>
                  </div>

                  <div className="oa-kpi-card__middle">
                    <div className="oa-kpi-card__value">98%</div>
                    <img src={SparkGraphIcon} alt="" className="oa-kpi-card__graph" />
                  </div>

                  <span className="oa-kpi-card__trend oa-kpi-card__trend--up">
                    <img src={UpArrowIcon} alt="" width="10" height="10" />
                    <span>+8.1% vs last quarter</span>
                  </span>
                </article>
              </section>

              {/* ---------------------------------------- */}
              {/* Row 1                                     */}
              {/* ---------------------------------------- */}

              <section className="oa-row oa-row--health-perf">

                {/* Application Health */}
                <div className="oa-panel oa-panel--health-monitor">
                  <div className="oa-panel__head">
                    <h2>
                      Application Health Monitor
                    </h2>

                    <HealthFilterDropdown
                      value={healthFilter}
                      isOpen={openDropdown === 'health'}
                      onToggle={() => handleDropdownToggle('health')}
                      onSelect={handleHealthFilterSelect}
                    />
                  </div>

                  <ul className="oa-health-list">
                    {filteredHealth.map(
                      (item) => (
                        <li
                          key={item.id}
                          className={`oa-health-item${item.status === 'Critical' ? ' oa-health-item--critical' : ''}`}
                        >
                          <img
                            src={
                              HealthStatusIcon
                            }
                            alt=""
                            width="42"
                            height="44"
                          />

                          <span className="oa-health-item__text">
                            <p>
                              {item.name}
                            </p>

                            <span>
                              {item.meta}
                            </span>
                          </span>

                          <span
                            className={`oa-status-pill oa-status-pill--${item.status ===
                              'Critical'
                              ? 'critical'
                              : 'healthy'
                              }`}
                          >
                            {item.status}
                          </span>

                          <button
                            type="button"
                            className="oa-health-item__menu"
                            aria-label="Row options"
                          >
                            ⋮
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                {/* System Performance */}
                <div className="oa-panel">
                  <div className="oa-panel__head">
                    <h2>
                      System Performance (24h)
                    </h2>

                    <PeriodDropdown
                      id="performance"
                      value={periods.performance}
                      onSelect={handleDropdownSelect}
                    />
                  </div>

                  <div className="oa-chart-wrapper">
                    <span className="oa-line-chart__axis-title">Revenue (USD)</span>
                    <div className="oa-line-chart__yaxis">
                      {SYSTEM_PERFORMANCE.yLabels.map((label) => {
                        const valMap = { 250: 0, 200: 25, 150: 50, 100: 75, 0: 100 };
                        return (
                          <span
                            key={label}
                            style={{
                              position: 'absolute',
                              top: `${valMap[label]}%`,
                              transform: 'translateY(-50%)',
                              right: 0,
                            }}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="oa-line-chart__container">
                      <svg
                        className="oa-line-chart"
                        viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`}
                        preserveAspectRatio="none"
                      >
                        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                          <line
                            key={frac}
                            x1="0"
                            y1={chartHeight * frac}
                            x2={chartWidth}
                            y2={chartHeight * frac}
                            className="oa-chart-grid"
                          />
                        ))}

                        {/* Response Time — from asset */}
                        <image
                          href={RevenueTrendLine}
                          x="0"
                          y={chartHeight * 0.19}
                          width={chartWidth}
                          height={chartHeight * 0.57}
                          preserveAspectRatio="none"
                        />

                        {/* CPU Load — from asset */}
                        <image
                          href={CpuLoadTrendLine}
                          x="0"
                          y={chartHeight * 0.02}
                          width={chartWidth}
                          height={chartHeight * 0.76}
                          preserveAspectRatio="none"
                        />

                      </svg>

                      <div className="oa-line-chart__xaxis">
                        {SYSTEM_PERFORMANCE.xLabels.map(
                          (label) => (
                            <span key={label}>
                              {label}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="oa-line-chart__legend">
                    <span>
                      <i className="oa-dot oa-dot--solid" />
                      <span>Response Time</span>
                    </span>

                    <span>
                      <i className="oa-dot oa-dot--dashed" />
                      <span>CPU Load</span>
                    </span>
                  </div>
                </div>
              </section>

              {/* ---------------------------------------- */}
              {/* Row 2                                     */}
              {/* ---------------------------------------- */}

              <section className="oa-row oa-row--load-incident">

                {/* Server Load */}
                <div className="oa-panel oa-panel--server-load">
                  <div className="oa-panel__head">
                    <h2 className="oa-panel__title">Server Load By Region</h2>

                    <PeriodDropdown
                      id="server"
                      value={periods.server}
                      onSelect={handleDropdownSelect}
                    />
                  </div>

                  <div className="oa-barchart-wrapper">
                    <div className="oa-bar-chart__grid" aria-hidden="true">
                      {SERVER_LOAD_YLABELS.map((v, i) => (
                        <div
                          className="oa-bar-chart__grid-row"
                          key={v}
                          style={{ top: `${(i / (SERVER_LOAD_YLABELS.length - 1)) * 100}%` }}
                        >
                          <span className="oa-bar-chart__grid-tick">{v === 0 ? '0' : `${v / 1000}K`}</span>
                          <span className="oa-bar-chart__grid-line" />
                        </div>
                      ))}
                    </div>

                    <div className="oa-bar-chart__cols">
                      {SERVER_LOAD.map((region) => (
                        <div className="oa-bar-chart__col" key={region.label}>
                          <div className="oa-bar-chart__track">
                            <span className="oa-bar-chart__value">{region.value.toLocaleString()}</span>
                            <div
                              className="oa-bar-chart__bar"
                              style={{ height: `${(region.value / SERVER_LOAD_MAX) * 100}%`, background: region.color }}
                            />
                          </div>
                          <span className="oa-bar-chart__label">{region.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Incident Breakdown */}
                <div className="oa-panel oa-panel--incident-breakdown">
                  <div className="oa-panel__head">
                    <h2 className="oa-panel__title">
                      Incident Breakdown
                    </h2>

                    <PeriodDropdown
                      id="incident"
                      value={periods.incident}
                      onSelect={handleDropdownSelect}
                    />
                  </div>

                  <div className="oa-donut-row">

                    <svg
                      className="oa-donut"
                      viewBox="0 0 140 140"
                    >
                      {(() => {
                        let currentAngle = -90;
                        const gapDegrees = 5;
                        return INCIDENT_DATA.map((segment) => {
                          const startAngle = currentAngle + gapDegrees / 2;
                          const endAngle = currentAngle + (segment.percent / 100) * 360 - gapDegrees / 2;
                          currentAngle += (segment.percent / 100) * 360;

                          const pathData = getRoundedArcPath(
                            70,
                            70,
                            66,
                            42,
                            startAngle,
                            endAngle,
                            3
                          );

                          return (
                            <path
                              key={segment.label}
                              d={pathData}
                              fill={segment.color}
                            />
                          );
                        });
                      })()}

                      <text
                        x="70"
                        y="68"
                        textAnchor="middle"
                        className="oa-donut__value"
                      >
                        {TOTAL_INCIDENTS}
                      </text>

                      <text
                        x="70"
                        y="84"
                        textAnchor="middle"
                        className="oa-donut__label"
                      >
                        Total Incident
                      </text>
                    </svg>

                    <div className="oa-donut__legend">
                      {INCIDENT_DATA.map(
                        (segment) => (
                          <div
                            key={segment.label}
                            className="oa-donut__legend-box"
                            style={{ borderColor: segment.color }}
                          >
                            <span className="oa-donut__legend-label">
                              {segment.label.toUpperCase()}
                            </span>
                            <span className="oa-donut__legend-percent">
                              {segment.percent}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <AppFooter />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OperationsAnalytics;