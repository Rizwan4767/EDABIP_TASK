import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function KpiCardSkeleton() {
  return (
    <article className="um-kpi-card">
      <div className="um-kpi-card__head">
        <SkeletonLoader width={40} height={42} borderRadius={4} />
        <SkeletonLoader width="58%" height={16} />
      </div>
      <div className="um-kpi-card__metrics">
        <SkeletonLoader width={44} height={22} />
        <div className="um-kpi-card__spark">
          <SkeletonLoader width="100%" height={36} />
        </div>
      </div>
      <SkeletonLoader width={148} height={22} borderRadius={6} />
    </article>
  );
}

function TableCardSkeleton({ titleWidth, rowCount = 8 }) {
  return (
    <section className="db-card um-card" aria-hidden="true">
      <div className="db-card__header">
        <SkeletonLoader width={titleWidth} height={18} />
        <div className="um-card__header-actions">
          <SkeletonLoader width={220} height={36} borderRadius={6} />
          <SkeletonLoader width={88} height={36} borderRadius={6} />
          <SkeletonLoader width={110} height={36} borderRadius={6} />
        </div>
      </div>

      <div className="um-skel-table">
        <div className="um-skel-table__head">
          {Array.from({ length: 7 }, (_, index) => (
            <SkeletonLoader key={index} height={10} width={index === 0 ? 16 : '70%'} />
          ))}
        </div>
        {Array.from({ length: rowCount }, (_, row) => (
          <div key={row} className="um-skel-table__row">
            <SkeletonLoader width={16} height={16} borderRadius={4} />
            <SkeletonLoader width="72%" height={12} />
            <SkeletonLoader width="80%" height={12} />
            <SkeletonLoader width="88%" height={12} />
            <SkeletonLoader width="60%" height={12} />
            <SkeletonLoader width="75%" height={12} />
            <SkeletonLoader width={18} height={18} borderRadius={4} />
          </div>
        ))}
      </div>

      <div className="um-skel-pager">
        <SkeletonLoader width={210} height={14} />
        <div className="um-skel-pager-btns">
          <SkeletonLoader width={64} height={32} borderRadius={6} />
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonLoader key={index} width={32} height={32} borderRadius={6} />
          ))}
          <SkeletonLoader width={64} height={32} borderRadius={6} />
        </div>
      </div>
    </section>
  );
}

function UserManagementPageSkeleton() {
  return (
    <div className="um-skeleton" aria-busy="true" aria-live="polite">
      <p className="um-skeleton__status">Loading users</p>

      <section className="db-welcome" aria-hidden="true">
        <div className="db-welcome__inner">
          <div className="db-welcome__head">
            <div className="um-skel-welcome-copy">
              <SkeletonLoader width={280} height={24} />
              <SkeletonLoader width="70%" height={14} />
            </div>
            <div className="um-skel-welcome-actions">
              <SkeletonLoader width={128} height={36} borderRadius={6} />
              <SkeletonLoader width={140} height={36} borderRadius={6} />
              <SkeletonLoader width={96} height={36} borderRadius={6} />
            </div>
          </div>

          <section className="um-kpi-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <KpiCardSkeleton key={index} />
            ))}
          </section>
        </div>
      </section>

      <TableCardSkeleton titleWidth={90} />
      <TableCardSkeleton titleWidth={150} />
    </div>
  );
}

export default UserManagementPageSkeleton;
