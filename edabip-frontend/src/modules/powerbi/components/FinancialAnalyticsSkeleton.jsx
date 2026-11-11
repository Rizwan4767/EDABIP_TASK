import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function FinancialAnalyticsSkeleton() {
  return (
    <div className="fa-skeleton" aria-busy="true" aria-live="polite">

      {/* KPI CARDS */}
      <section className="fa-kpi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="fa-kpi-card">
            <div className="fa-kpi-card__header">
              <SkeletonLoader
                variant="circle"
                width={36}
                height={36}
              />
              <SkeletonLoader width="55%" height={14} />
            </div>

            <div className="fa-kpi-card__row">
              <SkeletonLoader width={80} height={26} />
              <SkeletonLoader width={40} height={24} />
            </div>

            <SkeletonLoader
              width={140}
              height={16}
              borderRadius={999}
            />
          </article>
        ))}
      </section>

      {/* CHARTS */}
      <section className="fa-charts-row" aria-hidden="true">
        <article className="db-card fa-chart-card">
          <div className="db-card__header">
            <SkeletonLoader width={220} height={18} />
            <SkeletonLoader
              width={140}
              height={32}
              borderRadius={8}
            />
          </div>

          <div className="fa-skel-chart">
            <SkeletonLoader
              width="100%"
              height="100%"
              borderRadius={8}
            />
          </div>
        </article>

        <article className="db-card fa-chart-card">
          <div className="db-card__header">
            <SkeletonLoader width={180} height={18} />
            <SkeletonLoader
              width={140}
              height={32}
              borderRadius={8}
            />
          </div>

          <div className="fa-skel-donut">
            <SkeletonLoader
              variant="circle"
              width={160}
              height={160}
            />

            <div className="fa-skel-donut__legend">
              {Array.from({ length: 3 }, (_, i) => (
                <SkeletonLoader
                  key={i}
                  width="100%"
                  height={28}
                  borderRadius={6}
                />
              ))}
            </div>
          </div>
        </article>
      </section>

    </div>
  );
}

export default FinancialAnalyticsSkeleton;