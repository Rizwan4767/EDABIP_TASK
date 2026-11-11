import barSun from '../../../assets/dashboard/charts/bars/sun.svg';
import barMon from '../../../assets/dashboard/charts/bars/mon.svg';
import barTues from '../../../assets/dashboard/charts/bars/tues.svg';
import barWed from '../../../assets/dashboard/charts/bars/wed.svg';
import barThu from '../../../assets/dashboard/charts/bars/thu.svg';
import barFri from '../../../assets/dashboard/charts/bars/fri.svg';
import barSat from '../../../assets/dashboard/charts/bars/sat.svg';

const REVENUE_POINTS = [
  { month: 'Jan', value: 28 },
  { month: 'Feb', value: 35 },
  { month: 'Mar', value: 31 },
  { month: 'Apr', value: 48 },
  { month: 'May', value: 55 },
  { month: 'Jun', value: 51 },
  { month: 'Jul', value: 63 },
  { month: 'Aug', value: 75 },
  { month: 'Sep', value: 81 },
];

const ACTIVE_USERS = [
  { day: 'Sun', value: 50000, bar: barSun },
  { day: 'Mon', value: 69749, bar: barMon },
  { day: 'Tues', value: 34910, bar: barTues },
  { day: 'Wedn', value: 59101, bar: barWed },
  { day: 'Thu', value: 85811, bar: barThu },
  { day: 'Fri', value: 71311, bar: barFri },
  { day: 'Sat', value: 47590, bar: barSat },
];

const MAX_REVENUE = 100;
const MAX_USERS = 100000;

function formatUsers(n) {
  return n.toLocaleString('en-US');
}

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

export function RevenueTrendChart() {
  const width = 760;
  const height = 200;
  const pad = { top: 14, right: 12, bottom: 6, left: 6 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yTicks = [100, 75, 50, 25, 0];

  const points = REVENUE_POINTS.map((p, i) => {
    const x = pad.left + (i / (REVENUE_POINTS.length - 1)) * plotW;
    const y = pad.top + (1 - p.value / MAX_REVENUE) * plotH;
    return { ...p, x, y };
  });

  const path = buildSmoothPath(points);

  return (
    <div className="db-chart db-chart--svg db-chart--revenue">
      <span className="db-chart__y-label">Revenue (USD)</span>
      <div className="db-chart__body">
        <div
          className="db-chart__y-axis"
          style={{ paddingTop: pad.top, paddingBottom: pad.bottom + 18 }}
          aria-hidden="true"
        >
          {yTicks.map((t) => (
            <span key={t}>{t === 0 ? '0' : `$${t}K`}</span>
          ))}
        </div>
        <div className="db-chart__frame">
          <svg
            className="db-chart__svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Revenue trend from January to September"
          >
            {yTicks.map((t) => {
              const y = pad.top + (1 - t / MAX_REVENUE) * plotH;
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
            <path d={path} className="db-chart__line-path" fill="none" />
            {points.map((p) => (
              <circle key={p.month} cx={p.x} cy={p.y} r="4.5" className="db-chart__dot" />
            ))}
          </svg>
          <div className="db-chart__x-axis">
            {REVENUE_POINTS.map((p) => (
              <span key={p.month}>{p.month}</span>
            ))}
          </div>
        </div>
      </div>
      <span className="db-chart__x-label">Month</span>
    </div>
  );
}

export function ActiveUsersChart() {
  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className="db-chart db-chart--svg db-chart--users">
      <span className="db-chart__y-label">Active User Count</span>
      <div className="db-chart__body">
        <div className="db-chart__y-axis db-chart__y-axis--users" aria-hidden="true">
          {yTicks.map((t) => (
            <span key={t}>{t === 0 ? '0' : `${t}K`}</span>
          ))}
        </div>

        <div className="db-chart__frame">
          <div className="db-users-plot">
            <div className="db-users-plot__grid" aria-hidden="true">
              {yTicks.map((t) => (
                <span key={t} className="db-users-plot__grid-line" />
              ))}
            </div>

            {ACTIVE_USERS.map((item) => {
              const pct = (item.value / MAX_USERS) * 100;
              return (
                <div className="db-users-col" key={item.day}>
                  <div className="db-users-col__track">
                    <div className="db-users-col__bar" style={{ height: `${pct}%` }}>
                      <span className="db-users-col__value">{formatUsers(item.value)}</span>
                      <div className="db-users-col__stem">
                        <img
                          className="db-users-col__spray"
                          src={item.bar}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                        />
                        <span className="db-users-col__tip" aria-hidden="true" />
                      </div>
                    </div>
                    <span className="db-users-col__base" aria-hidden="true" />
                  </div>
                  <span className="db-users-col__day">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <span className="db-chart__x-label">Days</span>
    </div>
  );
}
