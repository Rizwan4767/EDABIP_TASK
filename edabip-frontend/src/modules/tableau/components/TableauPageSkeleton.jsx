import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

const KPI_CARDS_COUNT = 6;
const MATRIX_CARDS_COUNT = 4;
const TABLE_ROWS_COUNT = 5;
const ACTIVITY_ROWS_COUNT = 4;

function TableauPageSkeleton() {
  return (
    <div className="tb-skeleton" aria-busy="true" aria-live="polite">
      <p className="tb-skeleton__status">Loading Tableau visualization</p>

      <section className="tb-kpi-grid" aria-hidden="true">
        {Array.from({ length: KPI_CARDS_COUNT }, (_, index) => (
          <article key={index} className="tb-kpi-card">
            <div className="tb-kpi-card__top">
              <SkeletonLoader width={54} height={56} borderRadius={8} />
              <div className="tb-skel-kpi-copy">
                <SkeletonLoader width="70%" height={12} />
                <SkeletonLoader width="55%" height={18} />
              </div>
            </div>
            <SkeletonLoader width={130} height={14} />
          </article>
        ))}
      </section>

      <section className="tb-row tb-row--charts" aria-hidden="true">
        <article className="tb-card tb-card--trend">
          <div className="tb-card__header">
            <SkeletonLoader width={220} height={18} />
            <SkeletonLoader width={110} height={32} borderRadius={8} />
          </div>
          <SkeletonLoader width="100%" height={200} borderRadius={8} />
        </article>

        <article className="tb-card tb-card--category">
          <div className="tb-card__header">
            <SkeletonLoader width={150} height={18} />
            <SkeletonLoader width={110} height={32} borderRadius={8} />
          </div>
          <SkeletonLoader width="100%" height={200} borderRadius={8} />
        </article>
      </section>

      <section className="tb-row tb-row--mid" aria-hidden="true">
        <article className="tb-card tb-card--forecast">
          <div className="tb-card__header">
            <SkeletonLoader width={230} height={18} />
          </div>
          <SkeletonLoader width="100%" height={180} borderRadius={8} />
        </article>

        <article className="tb-card tb-card--matrix">
          <div className="tb-card__header">
            <SkeletonLoader width={100} height={18} />
            <SkeletonLoader width={110} height={32} borderRadius={8} />
          </div>
          <div className="tb-matrix-grid">
            {Array.from({ length: MATRIX_CARDS_COUNT }, (_, index) => (
              <div key={index} className="tb-matrix-card">
                <div className="tb-matrix-card__head">
                  <SkeletonLoader width="60%" height={12} />
                  <SkeletonLoader width={44} height={12} />
                </div>
                <div className="tb-matrix-card__body">
                  <SkeletonLoader width="50%" height={20} />
                  <SkeletonLoader width={54} height={20} borderRadius={4} />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="tb-row tb-row--bottom" aria-hidden="true">
        <article className="tb-card tb-card--table">
          <div className="tb-card__header">
            <SkeletonLoader width={190} height={18} />
          </div>
          <div className="tb-skel-table">
            <div className="tb-skel-table__head">
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonLoader key={index} height={10} />
              ))}
            </div>
            {Array.from({ length: TABLE_ROWS_COUNT }, (_, row) => (
              <div key={row} className="tb-skel-table__row">
                {Array.from({ length: 4 }, (_, col) => (
                  <SkeletonLoader
                    key={col}
                    width={col === 1 ? 70 : '80%'}
                    height={col === 1 ? 20 : 12}
                    borderRadius={col === 1 ? 999 : 6}
                  />
                ))}
              </div>
            ))}
          </div>
        </article>

        <article className="tb-card tb-card--activity">
          <div className="tb-card__header">
            <SkeletonLoader width={140} height={18} />
          </div>
          <ul className="tb-activity">
            {Array.from({ length: ACTIVITY_ROWS_COUNT }, (_, index) => (
              <li key={index} className="tb-activity__item">
                <SkeletonLoader width={34} height={36} borderRadius={6} />
                <div className="tb-skel-activity-copy">
                  <SkeletonLoader width="80%" height={13} />
                  <SkeletonLoader width="55%" height={12} />
                </div>
                <SkeletonLoader width={48} height={12} />
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

export default TableauPageSkeleton;
