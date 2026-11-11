import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function KpiCardSkeleton({ showSpark = true }) {
  return (
    <article className="rep-kpi-card">
      <div className="rep-kpi-card__top">
        <SkeletonLoader width={40} height={42} borderRadius={4} />
        <SkeletonLoader width="58%" height={16} />
      </div>
      <div className="rep-kpi-card__middle">
        <SkeletonLoader width={showSpark ? 48 : 96} height={22} />
        {showSpark ? (
          <div className="rep-sparkline">
            <SkeletonLoader width="100%" height={32} />
          </div>
        ) : null}
      </div>
      <SkeletonLoader width={132} height={18} borderRadius={4} />
    </article>
  );
}

function ListCardSkeleton({ titleWidth }) {
  return (
    <article className="rep-card" aria-hidden="true">
      <div className="rep-card__header">
        <SkeletonLoader width={titleWidth} height={16} />
        <SkeletonLoader width={72} height={30} borderRadius={4} />
      </div>
      <div className="rep-list">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rep-list__item">
            <SkeletonLoader width={36} height={36} borderRadius={6} />
            <div className="rep-list__copy">
              <SkeletonLoader width="78%" height={14} />
              <SkeletonLoader width="52%" height={12} />
            </div>
            <SkeletonLoader width={72} height={20} borderRadius={4} />
            <SkeletonLoader width={16} height={16} borderRadius={4} />
          </div>
        ))}
      </div>
    </article>
  );
}

function ReportsPageSkeleton() {
  return (
    <div className="rep-skeleton" aria-busy="true" aria-live="polite">
      <p className="rep-skeleton__status">Loading reports</p>

      <section className="rep-welcome" aria-hidden="true">
        <div className="rep-skel-welcome-copy">
          <SkeletonLoader width={280} height={24} />
          <SkeletonLoader width="72%" height={14} />
        </div>
        <div className="rep-skel-welcome-actions">
          <SkeletonLoader width={128} height={36} borderRadius={6} />
          <SkeletonLoader width={140} height={36} borderRadius={6} />
          <SkeletonLoader width={96} height={36} borderRadius={6} />
        </div>
      </section>

      <section className="rep-kpi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <KpiCardSkeleton key={index} />
        ))}
        <KpiCardSkeleton showSpark={false} />
      </section>

      <section className="rep-row rep-row--charts" aria-hidden="true">
        <article className="rep-card">
          <div className="rep-card__header">
            <SkeletonLoader width={190} height={16} />
            <SkeletonLoader width={110} height={30} borderRadius={4} />
          </div>
          <SkeletonLoader width="100%" height={185} borderRadius={8} />
        </article>
        <article className="rep-card">
          <div className="rep-card__header">
            <SkeletonLoader width={140} height={16} />
            <SkeletonLoader width={110} height={30} borderRadius={4} />
          </div>
          <div className="rep-skel-donut">
            <SkeletonLoader variant="circle" width={150} height={150} />
          </div>
        </article>
      </section>

      <section className="rep-row rep-row--split" aria-hidden="true">
        <ListCardSkeleton titleWidth={130} />
        <ListCardSkeleton titleWidth={170} />
      </section>

      <section className="rep-row" aria-hidden="true">
        <article className="rep-card rep-table-card">
          <div className="rep-card__header">
            <SkeletonLoader width={130} height={16} />
            <div className="rep-activity-actions">
              <SkeletonLoader width={220} height={36} borderRadius={6} />
              <SkeletonLoader width={110} height={36} borderRadius={6} />
            </div>
          </div>

          <div className="rep-skel-table">
            <div className="rep-skel-table__head">
              {Array.from({ length: 8 }, (_, index) => (
                <SkeletonLoader key={index} height={10} width={index === 0 ? 16 : '70%'} />
              ))}
            </div>
            {Array.from({ length: 8 }, (_, row) => (
              <div key={row} className="rep-skel-table__row">
                <SkeletonLoader width={16} height={16} borderRadius={4} />
                <SkeletonLoader width="82%" height={12} />
                <SkeletonLoader width="70%" height={12} />
                <SkeletonLoader width="64%" height={12} />
                <SkeletonLoader width="78%" height={12} />
                <SkeletonLoader width="72%" height={12} />
                <SkeletonLoader width={72} height={18} borderRadius={4} />
                <SkeletonLoader width={36} height={16} borderRadius={4} />
              </div>
            ))}
          </div>

          <div className="rep-skel-pager">
            <SkeletonLoader width={210} height={14} />
            <div className="rep-skel-pager-btns">
              <SkeletonLoader width={64} height={32} borderRadius={6} />
              {Array.from({ length: 5 }, (_, index) => (
                <SkeletonLoader key={index} width={32} height={32} borderRadius={6} />
              ))}
              <SkeletonLoader width={64} height={32} borderRadius={6} />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

export default ReportsPageSkeleton;
