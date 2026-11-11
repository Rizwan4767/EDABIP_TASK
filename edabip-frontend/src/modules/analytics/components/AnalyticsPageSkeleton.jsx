import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function AnalyticsPageSkeleton() {
  return (
    <div className="an-skeleton" aria-busy="true" aria-live="polite">
      

      {/* KPI cards  */}
      <section className="tb-kpi-grid an-kpi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="tb-kpi-card an-kpi-card">
            <div className="an-kpi-card__head">
              <SkeletonLoader variant="circle" width={54} height={56} borderRadius={6} />
              <SkeletonLoader width="55%" height={20} />
            </div>
            <div className="an-kpi-card__value-row">
              <SkeletonLoader width={70} height={22} />
               <div className="an-kpi-card__spark">
              <SkeletonLoader width="100%" height="100%" borderRadius={6} />
            </div>
            </div>
            <SkeletonLoader width={130} height={24} borderRadius={6} />
          </article>
        ))}
      </section>

      {/* Revenue Forecast + Demand Prediction chart cards */}
      <section className="tb-row tb-row--charts" aria-hidden="true">
        <article className="tb-card">
          <div className="tb-card__header">
            <SkeletonLoader width={180} height={18} />
            <SkeletonLoader width={140} height={36} borderRadius={8} />
          </div>
          <div className="an-skel-chart">
            {Array.from({ length: 9 }, (_, index) => (
              <SkeletonLoader
                key={index}
                width="100%"
                height={`${35 + ((index * 13) % 55)}%`}
                borderRadius={6}
              />
            ))}
          </div>
        </article>

        <article className="tb-card">
          <div className="tb-card__header">
            <SkeletonLoader width={240} height={18} />
            <SkeletonLoader width={140} height={36} borderRadius={8} />
          </div>
          <div className="an-skel-chart">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonLoader
                key={index}
                width="100%"
                height={`${30 + ((index * 17) % 60)}%`}
                borderRadius={6}
              />
            ))}
          </div>
        </article>
      </section>

      {/* ML Model Registry table */}
      <section className="an-registry-row" aria-hidden="true">
        <article className="tb-card tb-card--table">
          <div className="tb-card__header">
            <SkeletonLoader width={180} height={18} />
            <SkeletonLoader width={90} height={16} />
          </div>
          <div className="an-skel-table">
            <div className="an-skel-table__head">
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonLoader key={index} height={10} />
              ))}
            </div>
            {Array.from({ length: 4 }, (_, row) => (
              <div key={row} className="an-skel-table__row">
                <SkeletonLoader width="80%" height={12} />
                <SkeletonLoader width="70%" height={12} />
                <SkeletonLoader width="50%" height={12} />
                <SkeletonLoader width={60} height={20} borderRadius={999} />
                <SkeletonLoader width={50} height={16} borderRadius={4} />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

export default AnalyticsPageSkeleton;