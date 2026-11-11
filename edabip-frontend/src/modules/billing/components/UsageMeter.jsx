import UsersIcon from '../../../assets/dashboard/billing/users.svg';
import StorageIcon from '../../../assets/dashboard/billing/storage.svg';
import ReportsIcon from '../../../assets/dashboard/billing/reports.svg';
import DashboardsIcon from '../../../assets/dashboard/billing/dashboards.svg';
import ProcessingIcon from '../../../assets/dashboard/billing/data-processing.svg';

const USAGE_ICONS = {
  users: { src: UsersIcon, invert: true },
  storage: { src: StorageIcon, invert: false },
  reports: { src: ReportsIcon, invert: false },
  dashboards: { src: DashboardsIcon, invert: false },
  processing: { src: ProcessingIcon, invert: false },
};

function UsageMeter({ items = [], onViewAll }) {
  return (
    <section className="bl-card bl-usage" aria-label="Usage overview">
      <div className="bl-card__header">
        <h3>Usage Overview (Current Period)</h3>
        <button type="button" className="bl-link" onClick={onViewAll}>
          View All
        </button>
      </div>

      <div className="bl-usage__grid">
        {items.map((item) => {
          const icon = USAGE_ICONS[item.id] || USAGE_ICONS.users;
          return (
            <article key={item.id} className="bl-usage-item">
              <div className="bl-usage-item__top">
                <img
                  src={icon.src}
                  alt=""
                  width="20"
                  height="16"
                  className={`bl-usage-item__icon${icon.invert ? ' bl-usage-item__icon--invert' : ''}`}
                />
                <h4>{item.label}</h4>
                <span>{item.percent}%</span>
              </div>
              <div className="bl-usage-item__body">
                <p className="bl-usage-item__value">{item.value}</p>
                <div className="bl-usage-item__track" aria-hidden="true">
                  <div className="bl-usage-item__fill" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="bl-usage-item__limit">{item.limit}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default UsageMeter;
