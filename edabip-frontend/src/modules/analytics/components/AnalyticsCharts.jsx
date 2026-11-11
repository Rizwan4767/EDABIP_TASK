const REVENUE_FORECAST_DATA = [
  { month: 'Jan', value: 26000 },
  { month: 'Feb', value: 32000 },
  { month: 'Mar', value: 29000 },
  { month: 'Apr', value: 48000 },
  { month: 'May', value: 54000 },
  { month: 'Jun', value: 50000 },
  { month: 'Jul', value: 60000 },
  { month: 'Aug', value: 72000 },
  { month: 'Sep', value: 80000 },
];

const DEMAND_PREDICTION_DATA = [
  { day: 'Mon', value: 23000, color: '#ABF2E8' },
  { day: 'Tue', value: 35000, color: '#D8BFF2' },
  { day: 'Wed', value: 65000, color: '#C8D8F9' },
  { day: 'Thu', value: 95000, color: '#446665' },
  { day: 'Fri', value: 55000, color: '#134B4A80' },
  { day: 'Sat', value: 45000, color: '#70A9A8B2' },
  { day: 'Sun', value: 60000, color: '#EFB2B3' },
];

const MAX_REVENUE = 100000;
const MAX_DEMAND = 100000;
const Y_TICKS = [100000, 75000, 50000, 25000, 0];

function formatK(v) {
  return v === 0 ? '0' : `$${v / 1000}K`;
}

/** Same smoothing technique as TrendAnalysisChart — quadratic midpoint curve. */
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

export function RevenueForecastChart({ data = REVENUE_FORECAST_DATA }) {
  const width = 780;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 8, left: 8 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const points = data.map((d, i) => {
    const x = pad.left + (i / (data.length - 1)) * plotW;
    const y = pad.top + (1 - d.value / MAX_REVENUE) * plotH;
    return { ...d, x, y };
  });

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points.at(-1).x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;

  return (
    <div className="an-chart">
      <span className="an-chart__y-label">Revenue (USD)</span>
      <div className="an-chart__body">
        <div
          className="an-chart__y-axis"
          style={{ paddingTop: pad.top, paddingBottom: pad.bottom + 18 }}
          aria-hidden="true"
        >
          {Y_TICKS.map((t) => (
            <span key={t}>{formatK(t)}</span>
          ))}
        </div>
        <div className="an-chart__frame">
          <svg
            className="an-chart__svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Revenue forecast from January to September"
          >
            <defs>
              <linearGradient id="anRevenueForecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B4FFFD" stopOpacity="1" />
                <stop offset="100%" stopColor="#708C8C" stopOpacity="1" />
              </linearGradient>
            </defs>
            {Y_TICKS.map((t) => {
              const y = pad.top + (1 - t / MAX_REVENUE) * plotH;
              return (
                <line
                  key={`h-${t}`}
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  className="an-chart__grid"
                />
              );
            })}
            <path d={areaPath} fill="url(#anRevenueForecastFill)" />
            <path d={linePath} className="an-chart__line" fill="none" />
            {points.map((p) => (
              <circle key={p.month} cx={p.x} cy={p.y} r="4.5" className="an-chart__dot" />
            ))}
          </svg>
          <div className="an-chart__x-axis">
            {data.map((d) => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>
      </div>
      <span className="an-chart__x-label">Month</span>
    </div>
  );
}

export function DemandPredictionChart({ data = DEMAND_PREDICTION_DATA }) {
  return (
    <div className="an-bars">
      <div className="an-bars__plot">
        <div className="an-bars__y-axis" aria-hidden="true">
          {Y_TICKS.map((t) => (
            <span key={t}>{formatK(t)}</span>
          ))}
        </div>
        <div className="an-bars__body">
          <div className="an-bars__grid" aria-hidden="true">
            {Y_TICKS.map((t) => (
              <span key={t} className="an-bars__grid-line" />
            ))}
          </div>
          {data.map((item) => (
            <div key={item.day} className="an-bars__col">
              <div className="an-bars__bar-wrap">
                <span className="an-bars__val">{item.value.toLocaleString('en-US')}</span>
                <div
                  className="an-bars__bar"
                  style={{
                    height: `${(item.value / MAX_DEMAND) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>
              <span className="an-bars__day">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}