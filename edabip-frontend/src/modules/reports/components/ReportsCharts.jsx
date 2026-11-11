
import Graph14Icon from '../../../assets/dashboard/reports/graph-1-4.svg';
import Graph2Icon from '../../../assets/dashboard/reports/graph-2.svg';
import Graph3Icon from '../../../assets/dashboard/reports/graph-3.svg';

export function TotalReportsAreaChart() {
  return (
    <div className="rep-sparkline">
      <img src={Graph14Icon} alt="" />
    </div>
  );
}

export function CompletedLineChart() {
  return (
    <div className="rep-sparkline">
      <img src={Graph2Icon} alt="" />
    </div>
  );
}

export function FailedBarSparkline() {
  return (
    <div className="rep-sparkline">
      <img src={Graph3Icon} alt="" />
    </div>
  );
}

export const ScheduledAreaChart = TotalReportsAreaChart;

export function ReportTypeDistributionChart() {
  const width = 600;
  const height = 270;
  const pad = { top: 30, right: 0, bottom: 0, left: 58 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const yTicks = [100, 75, 50, 25, 0];
  const maxVal = 100;

  const data = [
    { label: 'Scheduled', value: 23, actual: 23000, color: '#a7f3d0' },
    { label: 'On Demand', value: 45, actual: 45000, color: '#e9d5ff' },
    { label: 'System Generated', value: 60, actual: 60000, color: '#bfdbfe' },
    { label: 'Ad-hoc', value: 93, actual: 93000, color: '#3d5a5a' }
  ];
  const colW = 82;
  const edgeGap = 18;
  const innerGap = (plotW - (data.length * colW) - (2 * edgeGap)) / (data.length - 1);

return (
    <div className="rep-chart rep-chart--distribution">
      <div className="rep-chart__body">
        <span className="rep-chart__y-title rep-chart__y-title--vertical">Revenue (USD)</span>
        <div className="rep-chart__frame" style={{ position: 'relative' }}>
          <svg className="rep-chart__svg" viewBox={`0 0 ${width} ${height}`}>
            {yTicks.map((t, idx) => {
              const y = pad.top + (1 - t / maxVal) * plotH;
              return (
                <g key={idx}>
                  <text
                    x={pad.left - 16}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="rep-chart__svg-y-label"
                  >
                    {t === 0 ? '0' : `$${t}K`}
                  </text>
                  <line
                    x1={pad.left}
                    y1={y}
                    x2={width - pad.right}
                    y2={y}
                    className="rep-chart__grid-line"
                    stroke="#f0f2f5"
                    strokeDasharray="4,4"
                  />
                  <line
                    x1={pad.left - 12}
                    y1={y}
                    x2={pad.left}
                    y2={y}
                    stroke="#9ba5b7"
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}
            <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={pad.top + plotH}
            stroke="#9ba5b7"
            strokeWidth="1.5"
            />
            <line
            x1={pad.left}
            y1={pad.top + plotH}
            x2={width - pad.right}
            y2={pad.top + plotH}
            stroke="#d1d5db"
            strokeWidth="1"
            />

           {data.map((item, idx) => {
  const x = pad.left + edgeGap + idx * (colW + innerGap);
  const barH = (item.value / maxVal) * plotH;
  const y = pad.top + plotH - barH;


              return (
                <g key={item.label}>
                  <rect
                    x={x}
                    y={y}
                    width={colW}
                    height={barH}
                    fill={item.color}
                    rx="4"
                    ry="4"
                    className="rep-chart__bar-rect"
                  />
                  <text
                    x={x + colW / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#374151"
                  >
                    {item.actual.toLocaleString()}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="rep-chart__x-axis" style={{ paddingLeft: pad.left, paddingRight: pad.right }}>
            {data.map((item, idx) => (
              <span
                key={item.label}
                className="rep-chart__x-label"
                style={{
                  left: `${((pad.left + edgeGap + idx * (colW + innerGap) + colW / 2) / width) * 100}%`
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReportsByStatusDonutChart() {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 15;

  const gapPercent = 0.5;

  const strokeLinecap = 'butt';

  const N = 3;
  const totalGapPercent = N * gapPercent;
  const totalActivePercent = 100 - totalGapPercent;

  const segments = [
    { id: 'completed', value: 75, color: '#d9d9d9' },
    { id: 'scheduled', value: 11, color: '#9feadd' },
    { id: 'failed', value: 13, color: '#bed1f6' }
  ];

  let accumulatedPercent = 0;

  const renderSegments = segments.map(seg => {
    const segmentPercent = (seg.value / 100) * totalActivePercent;
    const strokeLength = (segmentPercent / 100) * circumference;

    const offsetPercent = accumulatedPercent;
    const strokeOffset = -(offsetPercent / 100) * circumference;

    accumulatedPercent += segmentPercent + gapPercent;

    return {
      ...seg,
      strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
      strokeDashoffset: strokeOffset
    };
  });

  return (
    <div className="rep-donut-chart-container">
      <div className="rep-donut-svg-wrapper">
        <svg viewBox="0 0 100 100" className="rep-donut-chart__svg">
          <defs>
            <filter id="round-corners">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -6" />
            </filter>
          </defs>
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="transparent"
            strokeWidth={strokeWidth}
          />
          {renderSegments.map(seg => (
            <circle
              key={seg.id}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              transform="rotate(-105 50 50)"
              strokeLinecap={strokeLinecap}
              filter="url(#round-corners)"
            />
          ))}
        </svg>
        <div className="rep-donut-chart__center">
          <span className="rep-donut-chart__number">100</span>
          <span className="rep-donut-chart__label">Total</span>
        </div>
      </div>

      <div className="rep-donut-chart__legend">
        <div className="rep-legend-item rep-legend-item--completed">
          <span className="rep-legend-item__label">Completed</span>
          <span className="rep-legend-item__value">75%</span>
        </div>
        <div className="rep-legend-item rep-legend-item--scheduled">
          <span className="rep-legend-item__label">Scheduled</span>
          <span className="rep-legend-item__value">11%</span>
        </div>
        <div className="rep-legend-item rep-legend-item--failed">
          <span className="rep-legend-item__label">Failed</span>
          <span className="rep-legend-item__value">13%</span>
        </div>
      </div>
    </div>
  );
}
