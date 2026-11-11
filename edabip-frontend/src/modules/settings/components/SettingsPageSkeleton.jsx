import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

function SettingsPageSkeleton() {
  return (
    <div className="st-skeleton" aria-busy="true" aria-live="polite">
      <p className="st-skeleton__status">Loading settings</p>

      <section className="st-card" aria-hidden="true">
        <div className="st-card__header">
          <SkeletonLoader width={180} height={18} />
          <SkeletonLoader variant="circle" width={28} height={28} />
        </div>
        <div className="st-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="st-field">
              <SkeletonLoader width="40%" height={12} />
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
            </div>
          ))}
        </div>
        <div className="st-form__footer">
          <span />
          <SkeletonLoader width={140} height={36} borderRadius={6} />
        </div>
      </section>

      <section className="st-card" aria-hidden="true">
        <div className="st-card__header">
          <SkeletonLoader width={220} height={18} />
          <SkeletonLoader variant="circle" width={28} height={28} />
        </div>
        <div className="st-notify__fields">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="st-field">
              <SkeletonLoader width="50%" height={12} />
              <SkeletonLoader width="100%" height={40} borderRadius={8} />
            </div>
          ))}
        </div>
      </section>

      <div className="st-split" aria-hidden="true">
        <section className="st-card">
          <SkeletonLoader width={120} height={18} />
          <div className="st-skel-table">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonLoader key={index} width="100%" height={36} borderRadius={6} />
            ))}
          </div>
        </section>
        <section className="st-card">
          <SkeletonLoader width={90} height={18} />
          <SkeletonLoader width="100%" height={40} borderRadius={8} />
          <SkeletonLoader width={180} height={28} />
          <SkeletonLoader width={180} height={36} borderRadius={6} />
        </section>
      </div>
    </div>
  );
}

export default SettingsPageSkeleton;
