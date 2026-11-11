import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function CustomerAnalyticsSkeleton() {
  return (
    <div className="ca-skeleton" aria-busy="true" aria-live="polite">
      <p className="ca-skeleton__status">Loading customer analytics</p>

      {/* Header: back arrow, title, last refreshed, export */}
      <section className="ca-header" aria-hidden="true">
        <div className="ca-header__left">
          <SkeletonLoader variant="circle" width={28} height={28} />
          <SkeletonLoader width={200} height={22} />
        </div>
        <SkeletonLoader width={140} height={16} />
        <SkeletonLoader width={100} height={36} borderRadius={8} />
      </section>

      {/* Tabs row: Sales / Financial / Customer / HR / Operations */}
      <nav className="ca-tabs" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonLoader key={index} width={130} height={34} borderRadius={999} />
        ))}
      </nav>

      {/* KPI cards: Total Customers, Churn Rate, Avg Order Value, Est. CLV */}
      <section className="db-kpi-grid ca-kpis" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="db-kpi-card ca-kpi-card">
            <div className="ca-kpi-card__head">
              <SkeletonLoader variant="circle" width={40} height={40} />
              <SkeletonLoader width="55%" height={14} />
            </div>
            <div className="ca-kpi-card__body">
              <SkeletonLoader width="45%" height={26} />
              <SkeletonLoader width={70} height={30} />
            </div>
            <SkeletonLoader width="70%" height={14} />
          </article>
        ))}
      </section>

      {/* Retention Trends (line chart) + Acquisition Performance (bar chart) */}
      <section className="db-charts-row ca-charts-row" aria-hidden="true">
        <article className="db-card ca-chart-card ca-chart-card--retention">
          <div className="ca-chart-card__head">
            <SkeletonLoader width={170} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>
          <SkeletonLoader width="100%" height={200} borderRadius={8} />
        </article>

        <article className="db-card ca-chart-card ca-chart-card--acquisition">
          <div className="ca-chart-card__head">
            <SkeletonLoader width={190} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>
          <div
            className="ca-skel-bar-chart"
            style={{ display: 'flex', alignItems: 'flex-end', gap: 24, height: 200 }}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLoader
                key={index}
                width={48}
                height={`${40 + ((index * 17) % 55)}%`}
                borderRadius={6}
              />
            ))}
          </div>
        </article>
      </section>

      {/* Customer Segments donut + legend */}
      <section className="ca-segments" aria-hidden="true">
        <article className="db-card ca-chart-card ca-segments-card">
          <div className="ca-chart-card__head">
            <SkeletonLoader width={180} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>
          <div className="ca-segments-card__body">
            <SkeletonLoader variant="circle" width={280} height={280} />
            <div className="ca-legend" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 3 }, (_, index) => (
                <SkeletonLoader key={index} width={110} height={36} borderRadius={999} />
              ))}
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default CustomerAnalyticsSkeleton;