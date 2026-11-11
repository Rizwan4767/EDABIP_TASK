import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function OperationsAnalyticsSkeleton() {
  return (
    <div className="oa-skeleton" aria-busy="true" aria-live="polite">

      {/* KPI CARDS */}
      <section className="oa-kpis" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="oa-kpi-card">
            <div className="oa-kpi-card__head">
              <SkeletonLoader variant="circle" width={40} height={40} />
              <SkeletonLoader width="55%" height={14} />
            </div>

            <div className="oa-kpi-card__middle">
              <SkeletonLoader width={80} height={26} />
              <SkeletonLoader width={60} height={24} />
            </div>

            <SkeletonLoader width={140} height={16} borderRadius={999} />
          </article>
        ))}
      </section>

       {/* ROW 1: Application Health + System Performance  */}
      <section className="oa-row oa-row--health-perf" aria-hidden="true">
        <div className="oa-panel">
          <div className="oa-panel__head">
            <SkeletonLoader width={220} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>

          <ul className="oa-health-list">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="oa-health-item">
                <SkeletonLoader variant="circle" width={20} height={20} />
                <span className="oa-health-item__text" style={{ flex: 1 }}>
                  <SkeletonLoader width="60%" height={12} />
                  <SkeletonLoader width="40%" height={12} />
                </span>
                <SkeletonLoader width={64} height={20} borderRadius={999} />
              </li>
            ))}
          </ul>
        </div>

        <div className="oa-panel">
          <div className="oa-panel__head">
            <SkeletonLoader width={220} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>

          <div className="oa-skel-chart">
            <SkeletonLoader width="100%" height="100%" borderRadius={8} />
          </div>

          <div className="oa-line-chart__legend">
            <SkeletonLoader width={90} height={12} />
            <SkeletonLoader width={90} height={12} />
          </div>
        </div>
      </section>

      {/* ROW 2: Server Load + Incident Breakdown */}
      <section className="oa-row oa-row--load-incident" aria-hidden="true">
        <div className="oa-panel">
          <div className="oa-panel__head">
            <SkeletonLoader width={200} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>

          <div className="oa-bar-chart">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="oa-bar-chart__col">
                <SkeletonLoader
                  width={32}
                  height={`${50 + index * 15}%`}
                  borderRadius={4}
                />
                <SkeletonLoader width="70%" height={12} />
              </div>
            ))}
          </div>
        </div>

        <div className="oa-panel">
          <div className="oa-panel__head">
            <SkeletonLoader width={180} height={18} />
            <SkeletonLoader width={140} height={32} borderRadius={8} />
          </div>

          <div className="oa-donut-row">
            <SkeletonLoader variant="circle" width={140} height={140} />
            <div className="oa-donut__legend" style={{ flex: 1 }}>
              {Array.from({ length: 3 }, (_, i) => (
                <SkeletonLoader key={i} width="100%" height={32} borderRadius={6} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default OperationsAnalyticsSkeleton;