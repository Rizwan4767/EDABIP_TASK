const TREND_POINTS = [
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

const FORECAST_DATA = [
  { month: 'Jan', actual: 23000, forecast: 65000 },
  { month: 'Feb', actual: 22000, forecast: 40000 },
  { month: 'Mar', actual: 48000, forecast: 51000 },
  { month: 'Apr', actual: 73000, forecast: 82000 },
  { month: 'May', actual: 46000, forecast: 81000 },
  { month: 'Jun', actual: 28000, forecast: 42000 },
];

const MAX_TREND = 100;
const MAX_FORECAST = 100000;

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

export function TrendAnalysisChart() {
  const width = 780;
  const height = 240;
  const pad = { top: 12, right: 8, bottom: 8, left: 8 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const yTicks = [100, 75, 50, 25, 0];

  const points = TREND_POINTS.map((p, i) => {
    const x = pad.left + (i / (TREND_POINTS.length - 1)) * plotW;
    const y = pad.top + (1 - p.value / MAX_TREND) * plotH;
    return { ...p, x, y };
  });

  const linePath = buildSmoothPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${pad.top + plotH} L ${points[0].x} ${pad.top + plotH} Z`;

  return (
    <div className="tb-chart tb-chart--trend">
      <span className="tb-chart__y-label">Revenue (USD)</span>
      <div className="tb-chart__body">
        <div
          className="tb-chart__y-axis"
          style={{ paddingTop: pad.top, paddingBottom: pad.bottom + 18 }}
          aria-hidden="true"
        >
          {yTicks.map((t) => (
            <span key={t}>{t === 0 ? '0' : `$${t}K`}</span>
          ))}
        </div>
        <div className="tb-chart__frame">
          <svg
            className="tb-chart__svg"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Revenue trend from January to September"
          >
            <defs>
              <linearGradient id="tbTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3e9593" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3e9593" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {yTicks.map((t) => {
              const y = pad.top + (1 - t / MAX_TREND) * plotH;
              return (
                <line
                  key={`h-${t}`}
                  x1={pad.left}
                  y1={y}
                  x2={width - pad.right}
                  y2={y}
                  className="tb-chart__grid"
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
                className="tb-chart__grid"
              />
            ))}
            <path d={areaPath} fill="url(#tbTrendFill)" />
            <path d={linePath} className="tb-chart__line" fill="none" />
            {points.map((p) => (
              <circle key={p.month} cx={p.x} cy={p.y} r="4.5" className="tb-chart__dot" />
            ))}
          </svg>
          <div className="tb-chart__x-axis">
            {TREND_POINTS.map((p) => (
              <span key={p.month}>{p.month}</span>
            ))}
          </div>
        </div>
      </div>
      <span className="tb-chart__x-label">Month</span>
    </div>
  );
}

export function RevenueCategoryChart({ donutSrc }) {
  const categories = [
    { name: 'Sales', value: '$56.7M', tone: 'gray' },
    { name: 'Services', value: '$31.8M', tone: 'mint' },
    { name: 'Products', value: '$23.6M', tone: 'blue' },
    { name: 'Subscriptions', value: '$13.6M', tone: 'purple' },
  ];

  return (
    <div className="tb-donut">
      <div className="tb-donut__chart">
        <img src={donutSrc} alt="" className="tb-donut__ring" width="220" height="220" />
        <div className="tb-donut__center">
          <strong>125.8M</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="tb-donut__legend">
        {categories.map((item) => (
          <div key={item.name} className={`tb-donut__item tb-donut__item--${item.tone}`}>
            <span className="tb-donut__name">{item.name}</span>
            <span className="tb-donut__value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueForecastChart() {
  const yTicks = [100, 75, 50, 25, 0];

  return (
    <div className="tb-forecast">
      <div className="tb-forecast__plot">
        <div className="tb-forecast__y-axis" aria-hidden="true">
          {yTicks.map((t) => (
            <span key={t}>{t === 0 ? '0' : `${t}K`}</span>
          ))}
        </div>
        <div className="tb-forecast__bars">
          <div className="tb-forecast__grid" aria-hidden="true">
            {yTicks.map((t) => (
              <span key={t} className="tb-forecast__grid-line" />
            ))}
          </div>
          {FORECAST_DATA.map((item) => (
            <div key={item.month} className="tb-forecast__col">
              <div className="tb-forecast__pair">
                <div className="tb-forecast__bar-wrap">
                  <span className="tb-forecast__val">
                    {item.actual.toLocaleString('en-US')}
                  </span>
                  <div
                    className="tb-forecast__bar tb-forecast__bar--actual"
                    style={{ height: `${(item.actual / MAX_FORECAST) * 100}%` }}
                  />
                </div>
                <div className="tb-forecast__bar-wrap">
                  <span className="tb-forecast__val">
                    {item.forecast.toLocaleString('en-US')}
                  </span>
                  <div
                    className="tb-forecast__bar tb-forecast__bar--forecast"
                    style={{ height: `${(item.forecast / MAX_FORECAST) * 100}%` }}
                  />
                </div>
              </div>
              <span className="tb-forecast__month">{item.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="tb-forecast__legend">
        <span className="tb-forecast__legend-item tb-forecast__legend-item--actual">
          Actual Revenue
        </span>
        <span className="tb-forecast__legend-item tb-forecast__legend-item--forecast">
          Forecasted Revenue
        </span>
      </div>
    </div>
  );
}
