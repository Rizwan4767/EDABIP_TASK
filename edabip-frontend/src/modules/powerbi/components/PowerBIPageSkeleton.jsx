import SkeletonLoader from '../../../components/common/SkeletonLoader/index.jsx';

const REPORT_CARDS_COUNT = 5;

function PowerBIPageSkeleton() {
  return (
    <div className="pbi-skeleton" aria-busy="true" aria-live="polite">
      <p className="pbi-skeleton__status">Loading Power BI reports</p>

      <section className="pbi-reports" aria-hidden="true">
        {Array.from({ length: REPORT_CARDS_COUNT }, (_, index) => (
          <article key={index} className="pbi-report-card pbi-skel-card">
            <div className="pbi-report-card__header">
              <SkeletonLoader width={42} height={44} borderRadius={8} />
              <SkeletonLoader width="62%" height={18} />
            </div>

            <div className="pbi-skel-card__desc">
              <SkeletonLoader width="100%" height={13} />
              <SkeletonLoader width="82%" height={13} />
            </div>

            <div className="pbi-report-card__footer">
              <SkeletonLoader width={120} height={13} />
              <SkeletonLoader width={108} height={30} borderRadius={6} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default PowerBIPageSkeleton;
