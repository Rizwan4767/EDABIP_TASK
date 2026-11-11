import { useEffect, useId, useRef } from 'react';
import UsersIcon from '../../../assets/dashboard/billing/users.svg';
import StorageIcon from '../../../assets/dashboard/billing/storage.svg';
import ReportsIcon from '../../../assets/dashboard/billing/reports.svg';
import DashboardsIcon from '../../../assets/dashboard/billing/dashboards.svg';
import ProcessingIcon from '../../../assets/dashboard/billing/data-processing.svg';
// Shared modal chrome — backdrop, card, header, alert, buttons.
import './PaymentMethodModal.css';
import './UsageDetailModal.css';

const USAGE_ICONS = {
  users: UsersIcon,
  storage: StorageIcon,
  reports: ReportsIcon,
  dashboards: DashboardsIcon,
  processing: ProcessingIcon,
};

const STATUS_COPY = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
};

/**
 * "View All" on the Usage Overview card.
 *
 * The meter tiles already show every metric, so this is the detail that does
 * not fit in one: the period the figures cover, how much of each allowance is
 * left, and the storage thresholds the server judges a warning or critical
 * state against.
 */
function UsageDetailModal({
  isOpen,
  usage,
  storage,
  isLoadingStorage = false,
  storageFailed = false,
  onClose,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const metrics = usage?.metrics || [];

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="pm-modal__backdrop" onClick={handleBackdropClick}>
      <div
        className="pm-modal__card bl-usage-detail__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="pm-modal__form">
          <div className="pm-modal__header">
            <div className="pm-modal__header-copy">
              <h2 id={titleId} className="pm-modal__title">
                Usage Overview
              </h2>
              <p id={descriptionId} className="pm-modal__subtitle">
                {usage?.period
                  ? `Figures cover the current billing period, ${usage.period}.`
                  : 'Figures cover the current billing period.'}
              </p>
            </div>
            <button
              type="button"
              className="pm-modal__close"
              aria-label="Close dialog"
              onClick={onClose}
              ref={closeButtonRef}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          {metrics.length ? (
            <ul className="bl-usage-detail__list">
              {metrics.map((metric) => (
                <li key={metric.id} className="bl-usage-detail__item">
                  <div className="bl-usage-detail__head">
                    <img
                      src={USAGE_ICONS[metric.id] || UsersIcon}
                      alt=""
                      width="18"
                      height="16"
                    />
                    <h3>{metric.label}</h3>
                    <span className="bl-usage-detail__percent">{metric.percent}%</span>
                  </div>

                  <div
                    className="bl-usage-detail__track"
                    role="progressbar"
                    aria-label={`${metric.label} used`}
                    aria-valuenow={metric.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="bl-usage-detail__fill"
                      style={{ width: `${Math.min(metric.percent, 100)}%` }}
                    />
                  </div>

                  <dl className="bl-usage-detail__figures">
                    <div>
                      <dt>Used</dt>
                      <dd>{metric.used}</dd>
                    </div>
                    <div>
                      <dt>Limit</dt>
                      <dd>{metric.limit}</dd>
                    </div>
                    <div>
                      <dt>Remaining</dt>
                      <dd>{metric.remaining}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <p className="bl-usage-detail__empty">
              There are no usage figures for this period yet.
            </p>
          )}

          <section className="bl-usage-detail__storage" aria-label="Storage detail">
            <h3>Storage</h3>

            {isLoadingStorage ? (
              <p className="bl-usage-detail__note">Loading storage detail…</p>
            ) : null}

            {!isLoadingStorage && storageFailed ? (
              <p className="bl-usage-detail__note">
                Storage detail is unavailable right now. The storage figure above
                is still current.
              </p>
            ) : null}

            {!isLoadingStorage && storage ? (
              <>
                <dl className="bl-usage-detail__storage-grid">
                  <div>
                    <dt>Total</dt>
                    <dd>{storage.total}</dd>
                  </div>
                  <div>
                    <dt>Used</dt>
                    <dd>{storage.used}</dd>
                  </div>
                  <div>
                    <dt>Available</dt>
                    <dd>{storage.available}</dd>
                  </div>
                </dl>

                <p className="bl-usage-detail__note">
                  <span
                    className={`bl-usage-detail__status bl-usage-detail__status--${storage.status}`}
                  >
                    {STATUS_COPY[storage.status] || storage.status}
                  </span>
                  At {storage.percent}% of the allowance. Storage is flagged as a
                  warning from {storage.warningAt}% and critical from{' '}
                  {storage.criticalAt}%.
                </p>
              </>
            ) : null}
          </section>

          <div className="pm-modal__actions">
            <button
              type="button"
              className="pm-modal__btn pm-modal__btn--solid"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsageDetailModal;
