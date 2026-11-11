import CheckIcon from '../../../assets/dashboard/billing/plan-check-figma.svg';
import DividerIcon from '../../../assets/dashboard/billing/plan-divider.svg';
import GlowIcon from '../../../assets/dashboard/billing/plan-glow.svg';
import { BILLING_PLANS_SECTION_ID } from '../utils/constants.js';

function PlanActions({
  planName,
  isCurrent,
  isDeactivated,
  isBusy,
  isPending,
  isReactivating,
  onSelect,
  onDeactivate,
  onReactivate,
}) {
  if (!isCurrent) {
    return (
      <button
        type="button"
        className="bl-plan-card__cta"
        onClick={onSelect}
        disabled={isBusy}
        aria-busy={isPending}
      >
        {isPending ? 'Updating…' : 'Select Plan'}
      </button>
    );
  }

  if (isDeactivated) {
    return (
      <div className="bl-plan-card__actions">
        <p className="bl-plan-card__cta" aria-label={`${planName} deactivated`}>
          Deactivated
        </p>
        <button
          type="button"
          className="bl-plan-card__cta is-current"
          onClick={onReactivate}
          disabled={isBusy}
          aria-busy={isReactivating}
        >
          {isReactivating ? 'Reactivating…' : 'Reactivate Plan'}
        </button>
      </div>
    );
  }

  return (
    <div className="bl-plan-card__actions">
      <p className="bl-plan-card__cta is-current" aria-label={`${planName} active plan`}>
        Active Plan
      </p>
      <button
        type="button"
        className="bl-plan-card__cta"
        onClick={onDeactivate}
        disabled={isBusy}
      >
        Deactivate Plan
      </button>
    </div>
  );
}

function PlanSelector({
  plans = [],
  currentPlanId,
  onSelect,
  onDeactivate,
  onReactivate,
  pendingPlanId = null,
  isPlanDeactivated = false,
  isReactivating = false,
  isBusy = false,
}) {
  const isChanging = Boolean(pendingPlanId) || isBusy;

  return (
    <section className="bl-plans" id={BILLING_PLANS_SECTION_ID} aria-label="Choose a plan">
      <h3>Choose the Right Plan for Your Business</h3>
      <div className="bl-plans__grid">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPending = plan.id === pendingPlanId;
          // Highlight only the subscribed plan. `featured` is a marketing
          // flag for Professional and must not keep that card glowing when
          // Starter or Enterprise is current.
          const isFeatured = isCurrent || (!currentPlanId && Boolean(plan.featured));
          return (
            <article
              key={plan.id}
              className={`bl-plan-card${isFeatured ? ' bl-plan-card--featured' : ''}`}
            >
              {isFeatured ? (
                <img src={GlowIcon} alt="" className="bl-plan-card__glow" />
              ) : null}
              <p className="bl-plan-card__name">{plan.name}</p>
              <p className="bl-plan-card__price">
                <strong>{plan.price}</strong>
                <span>{plan.cadence}</span>
              </p>
              <p className="bl-plan-card__desc">{plan.description}</p>
              <div className="bl-plan-card__divider">
                <img src={DividerIcon} alt="" className="bl-plan-card__rule bl-plan-card__rule--left" />
                <span>what you will get</span>
                <img src={DividerIcon} alt="" className="bl-plan-card__rule bl-plan-card__rule--right" />
              </div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="bl-plan-card__check">
                      <img src={CheckIcon} alt="" width="22" height="22" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <PlanActions
                planName={plan.name}
                isCurrent={isCurrent}
                isDeactivated={isCurrent && isPlanDeactivated}
                isBusy={isChanging}
                isPending={isPending}
                isReactivating={isReactivating}
                onSelect={() => onSelect(plan.id)}
                onDeactivate={onDeactivate}
                onReactivate={onReactivate}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default PlanSelector;
