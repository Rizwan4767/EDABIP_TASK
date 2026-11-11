import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function BillingPageSkeleton() {
  return (
    <div className="bl-skeleton" aria-busy="true" aria-live="polite">
      <p className="bl-skeleton__status">Loading billing</p>

      <section className="bl-kpi-grid" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <article key={index} className="bl-kpi">
            <div className="bl-kpi__head">
              <SkeletonLoader variant="circle" width={45} height={45} />
              <SkeletonLoader width="48%" height={16} />
            </div>
            <SkeletonLoader width="62%" height={22} />
            <SkeletonLoader width={110} height={24} borderRadius={4} />
          </article>
        ))}
      </section>

      <section className="bl-card bl-usage" aria-hidden="true">
        <div className="bl-card__header">
          <SkeletonLoader width={260} height={18} />
          <SkeletonLoader width={72} height={16} />
        </div>
        <div className="bl-usage__grid">
          {Array.from({ length: 5 }, (_, index) => (
            <article key={index} className="bl-usage-item">
              <div className="bl-usage-item__top">
                <SkeletonLoader width={20} height={16} borderRadius={4} />
                <SkeletonLoader width="70%" height={14} />
                <SkeletonLoader width={32} height={14} />
              </div>
              <SkeletonLoader width="55%" height={16} />
              <SkeletonLoader width="100%" height={16} borderRadius={200} />
              <SkeletonLoader width="40%" height={12} />
            </article>
          ))}
        </div>
      </section>

      <div className="bl-split" aria-hidden="true">
        <section className="bl-card bl-history">
          <SkeletonLoader width={140} height={18} />
          <div className="bl-history__body">
            <div className="bl-skel-history-stats">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="bl-history__stat">
                  <SkeletonLoader width={34} height={36} borderRadius={6} />
                  <div className="bl-skel-history-copy">
                    <SkeletonLoader width={90} height={12} />
                    <SkeletonLoader width={70} height={18} />
                  </div>
                </div>
              ))}
            </div>
            <div className="bl-skel-chart">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonLoader
                  key={index}
                  width="100%"
                  height={`${40 + ((index * 17) % 45)}%`}
                  borderRadius={6}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bl-card bl-payment">
          <SkeletonLoader width={150} height={18} />
          <div className="bl-skel-payment-list">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="bl-skel-payment-row">
                <SkeletonLoader variant="circle" width={18} height={18} />
                <SkeletonLoader width={42} height={26} borderRadius={4} />
                <div className="bl-skel-history-copy">
                  <SkeletonLoader width="70%" height={14} />
                  <SkeletonLoader width="46%" height={12} />
                </div>
                <SkeletonLoader width={72} height={28} borderRadius={6} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="bl-plans" aria-hidden="true">
        <SkeletonLoader width={280} height={20} />
        <div className="bl-plans__grid">
          {Array.from({ length: 3 }, (_, index) => (
            <article key={index} className="bl-skel-plan">
              <SkeletonLoader width="40%" height={16} />
              <SkeletonLoader width="55%" height={28} />
              <SkeletonLoader count={3} gap={8} height={12} />
              <SkeletonLoader width="100%" height={44} borderRadius={999} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default BillingPageSkeleton;
