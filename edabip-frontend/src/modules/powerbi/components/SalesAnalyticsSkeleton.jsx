import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

const TABS_COUNT = 5;
const STAT_CARDS_COUNT = 4;
const REPS_ROWS_COUNT = 7;

function SalesAnalyticsSkeleton() {
  return (
    <div className="sa-skeleton" aria-busy="true" aria-live="polite">
      

      {/* header / breadcrumb */}
      <div className="sa-header" aria-hidden="true">
        <SkeletonLoader variant="circle" width={28} height={28} />
        <SkeletonLoader width={180} height={22} />
        <div className="sa-header-actions">
          <SkeletonLoader width={140} height={16} />
          <SkeletonLoader width={100} height={36} borderRadius={8} />
        </div>
      </div>

      {/* tabs */}
      <div className="sa-tabs" aria-hidden="true">
        {Array.from({ length: TABS_COUNT }, (_, index) => (
          <SkeletonLoader key={index} width={130} height={36} borderRadius={8} />
        ))}
      </div>

      {/* stat cards */}
      <section className="sa-stats-grid" aria-hidden="true">
        {Array.from({ length: STAT_CARDS_COUNT }, (_, index) => (
          <article key={index} className="sa-stat-card">
            <div className="sa-stat-top">
              <SkeletonLoader width={38} height={40} borderRadius={4} />
              <SkeletonLoader width="55%" height={15} />
            </div>
            <SkeletonLoader width="100%" height={27} />
            <SkeletonLoader width={110} height={24} borderRadius={4} />
          </article>
        ))}
      </section>

      {/* daily sales trend */}
      <section className="sa-card sa-trend-card" aria-hidden="true">
        <div className="sa-card-head">
          <SkeletonLoader width={200} height={20} />
        </div>

        <div className="sa-trend-chart-wrap">
          <SkeletonLoader width="100%" height={110} borderRadius={6} />
        </div>

        <div className="sa-trend-footer">
          <div className="sa-legend">
            <SkeletonLoader width={70} height={14} />
            <SkeletonLoader width={70} height={14} />
          </div>
          <SkeletonLoader width={60} height={12} />
        </div>
      </section>

      {/* bottom row */}
      <div className="sa-bottom-grid" aria-hidden="true">
        {/* monthly bar chart */}
        <section className="sa-card">
          <div className="sa-card-head">
            <SkeletonLoader width={220} height={20} />
            <SkeletonLoader width={140} height={36} borderRadius={8} />
          </div>
          <div className="sa-bar-chart-wrap">
            <SkeletonLoader width="100%" height={220} borderRadius={6} />
          </div>
          <div className="sa-bar-chart-footer">
            <SkeletonLoader width={60} height={12} />
          </div>
        </section>

        {/* sales by region map */}
        <section className="sa-card">
          <div className="sa-card-head">
            <SkeletonLoader width={150} height={20} />
          </div>
          <SkeletonLoader width="100%" height={160} borderRadius={6} />
          <div className="sa-map-legend">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="sa-map-legend-item">
                <SkeletonLoader width="70%" height={14} />
                <SkeletonLoader width="100%" height={3} borderRadius={2} />
              </div>
            ))}
          </div>
        </section>

        {/* top reps table */}
        <section className="sa-card sa-reps-card">
          <div className="sa-card-head">
            <SkeletonLoader width={110} height={20} />
            <SkeletonLoader width={70} height={14} />
          </div>
          <div className="sa-skel-reps-table">
            <div className="sa-skel-reps-head">
              <SkeletonLoader width="50%" height={12} />
              <SkeletonLoader width="30%" height={12} />
            </div>
            {Array.from({ length: REPS_ROWS_COUNT }, (_, index) => (
              <div key={index} className="sa-skel-reps-row">
                <SkeletonLoader width="60%" height={12} />
                <SkeletonLoader width="35%" height={12} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default SalesAnalyticsSkeleton;