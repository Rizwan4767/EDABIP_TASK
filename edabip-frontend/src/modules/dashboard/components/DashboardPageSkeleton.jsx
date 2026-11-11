import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function KpiHead() {
  return (
    <div className="db-kpi-card__header">
      <SkeletonLoader width={40} height={42} borderRadius={8} />
      <SkeletonLoader width="46%" height={14} />
    </div>
  );
}

function StatCopy({ titleWidth = '70%', valueWidth = '50%' }) {
  return (
    <div className="db-skel-stat-copy">
      <SkeletonLoader width={titleWidth} height={12} />
      <SkeletonLoader width={valueWidth} height={14} />
    </div>
  );
}

function SkeletonTable({ columns, rows }) {
  return (
    <div className="db-skel-table" style={{ '--db-skel-cols': columns }}>
      <div className="db-skel-table__head">
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonLoader key={index} width="70%" height={10} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="db-skel-table__row">
          {Array.from({ length: columns }, (_, col) => (
            <SkeletonLoader key={col} width={col === 0 ? '85%' : '65%'} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Sits inside `.db-welcome__inner`, so the greeting above it stays readable
// while the metrics load — same split the Billing page uses.
export function DashboardKpiSkeleton() {
  return (
    <>
      <p className="db-skel-status" aria-live="polite">
        Loading dashboard
      </p>

      <div className="db-kpi-grid" aria-hidden="true">
        <article className="db-kpi-card">
          <KpiHead />
          <div className="db-kpi-card__metrics">
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={96} height={28} />
              <SkeletonLoader width={78} height={13} />
            </div>
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={82} height={28} />
              <SkeletonLoader width={70} height={12} />
            </div>
          </div>
          <SkeletonLoader className="db-skel-spark" height={40} borderRadius={6} />
        </article>

        <article className="db-kpi-card">
          <KpiHead />
          <div className="db-kpi-card__metrics">
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={88} height={28} />
              <SkeletonLoader width={88} height={13} />
            </div>
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={62} height={28} />
              <SkeletonLoader width={70} height={12} />
            </div>
          </div>
          <div className="db-progress-block">
            <div className="db-progress-block__label">
              <SkeletonLoader width={34} height={13} />
              <SkeletonLoader width={76} height={12} />
            </div>
            <SkeletonLoader width="100%" height={8} borderRadius={200} />
          </div>
        </article>

        <article className="db-kpi-card">
          <KpiHead />
          <div className="db-kpi-card__metrics db-kpi-card__metrics--reports">
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={58} height={28} />
              <SkeletonLoader width={116} height={13} />
            </div>
            <SkeletonLoader width={96} height={24} borderRadius={60} />
          </div>
          <div className="db-kpi-card__divider" />
          <div className="db-kpi-card__rows">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="db-kpi-card__row">
                <SkeletonLoader width={112} height={13} />
                <SkeletonLoader width={22} height={13} />
              </div>
            ))}
          </div>
        </article>

        <article className="db-kpi-card">
          <KpiHead />
          <div className="db-kpi-card__metrics db-kpi-card__metrics--reports">
            <div className="db-skel-kpi-metric">
              <SkeletonLoader width={74} height={28} />
              <SkeletonLoader width={142} height={13} />
            </div>
            <SkeletonLoader width={72} height={24} borderRadius={60} />
          </div>
          <div className="db-kpi-card__divider" />
          <SkeletonLoader className="db-skel-spark" height={40} borderRadius={6} />
        </article>
      </div>
    </>
  );
}

// Everything below the welcome band: both chart cards, the data-source and
// scheduled-report cards, and the recent-activity table.
function DashboardPageSkeleton() {
  return (
    <>
      <section className="db-charts-row" aria-hidden="true">
        <article className="db-card db-card--revenue">
          <div className="db-card__header">
            <SkeletonLoader width={130} height={18} />
            <SkeletonLoader width={172} height={16} />
          </div>
          <SkeletonLoader width="100%" height={262} borderRadius={8} />
        </article>

        <article className="db-card db-card--users">
          <div className="db-card__header">
            <SkeletonLoader width={104} height={18} />
            <SkeletonLoader width={172} height={16} />
          </div>
          <div className="db-skel-bars">
            {Array.from({ length: 7 }, (_, index) => (
              <SkeletonLoader
                key={index}
                width="100%"
                height={`${45 + ((index * 19) % 50)}%`}
                borderRadius={6}
              />
            ))}
          </div>
          <div className="db-users-stats">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="db-users-stat">
                <SkeletonLoader width={34} height={36} borderRadius={8} />
                <StatCopy />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="db-mid-row" aria-hidden="true">
        <article className="db-card db-card--sources">
          <div className="db-card__header">
            <div className="db-card__title-group">
              <SkeletonLoader width={150} height={18} />
              <SkeletonLoader width={204} height={24} borderRadius={60} />
            </div>
            <SkeletonLoader width={68} height={16} />
          </div>

          <div className="db-source-stats">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="db-source-stat">
                <SkeletonLoader width={34} height={36} borderRadius={8} />
                <StatCopy valueWidth="42%" />
              </div>
            ))}
          </div>

          <SkeletonTable columns={5} rows={5} />
        </article>

        <article className="db-card db-card--scheduled">
          <div className="db-card__header">
            <SkeletonLoader width={140} height={18} />
            <SkeletonLoader width={172} height={16} />
          </div>
          <ul className="db-schedule-list">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="db-schedule-item">
                <SkeletonLoader width={34} height={36} borderRadius={8} />
                <StatCopy titleWidth="62%" valueWidth="44%" />
                <SkeletonLoader width={56} height={20} borderRadius={60} />
                <SkeletonLoader width={16} height={16} borderRadius={4} />
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="db-card db-card--activity" aria-hidden="true">
        <div className="db-card__header db-card__header--activity">
          <SkeletonLoader width={128} height={18} />
          <SkeletonLoader width={220} height={34} borderRadius={8} />
        </div>
        <SkeletonTable columns={7} rows={5} />
      </section>
    </>
  );
}

export default DashboardPageSkeleton;
