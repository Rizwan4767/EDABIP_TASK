import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function HRAnalyticsSkeleton() {
  return (
    <div className="hr-skeleton" aria-busy="true" aria-live="polite">
      
      {/* KPI CARDS */}
      <section className="hr-kpi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="hr-kpi-card">
            <div className="hr-kpi-card__top">
              <div className="hr-kpi-heading">
                <SkeletonLoader variant="circle" width={36} height={36} />
                <SkeletonLoader width="55%" height={14} />
              </div>
            </div>

            <div className="hr-kpi-card__bottom">
              <div className="hr-kpi-value-row">
                <SkeletonLoader width={80} height={26} />
                <SkeletonLoader width={40} height={24} />
              </div>
              <SkeletonLoader width={140} height={16} borderRadius={999} />
            </div>
          </article>
        ))}
      </section>

      {/* CHARTS */}
      <section className="hr-chart-grid" aria-hidden="true">
        {Array.from({ length: 2 }, (_, index) => (
          <article key={index} className="hr-chart-card">
            <div className="hr-chart-card__header">
              <SkeletonLoader width={220} height={18} />
              <SkeletonLoader width={140} height={32} borderRadius={8} />
            </div>

            <div className="hr-skel-chart">
              {Array.from({ length: 6 }, (_, bar) => (
                <SkeletonLoader
                  key={bar}
                  width="100%"
                  height={`${40 + ((bar * 17) % 45)}%`}
                  borderRadius={6}
                />
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default HRAnalyticsSkeleton;