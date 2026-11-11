import { useEffect, useId, useRef } from 'react';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';
// Shared modal chrome — backdrop, card, header, alert, buttons. Defined by
// the payment modal, reused here so the two billing dialogs match.
import './PaymentMethodModal.css';
import './PlanChangeModal.css';

/**
 * Confirmation step for "Select Plan".
 *
 * Changing plan charges the primary card immediately, so this is a real
 * confirmation rather than a formality — the API refuses any request that
 * isn't confirmed, and this is the screen that does the asking.
 */
function PlanChangeModal({
  isOpen,
  plan,
  currentPlanName,
  paymentMethod,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef(null);

  // Escape closes, but not mid-request: the charge is already on its way and
  // dismissing the dialog would leave the user guessing whether it went
  // through.
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        if (!isSubmitting) onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isSubmitting, onCancel]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    // Cancel takes the initial focus, not Confirm. This dialog spends real
    // money on the primary card, and an autofocused confirm button turns a
    // stray Enter — held over from the plan card that opened the dialog —
    // into a charge. The safe action is the one a blind keypress should hit.
    cancelButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) onCancel();
  };

  return (
    <div className="pm-modal__backdrop" onClick={handleBackdropClick}>
      <div
        className="pm-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="pm-modal__form">
          <div className="pm-modal__header">
            <div className="pm-modal__header-copy">
              <h2 id={titleId} className="pm-modal__title">
                Switch to {plan.name}?
              </h2>
              <p id={descriptionId} className="pm-modal__subtitle">
                {currentPlanName
                  ? `Your subscription moves from ${currentPlanName} to ${plan.name} straight away.`
                  : `This starts your ${plan.name} subscription straight away.`}
              </p>
            </div>
          </div>

          <dl className="bl-plan-confirm__summary">
            <div className="bl-plan-confirm__row">
              <dt>New plan</dt>
              <dd>{plan.name}</dd>
            </div>
            <div className="bl-plan-confirm__row">
              <dt>Price</dt>
              <dd>
                {plan.price}
                <span className="bl-plan-confirm__cadence">{plan.cadence}</span>
              </dd>
            </div>
            <div className="bl-plan-confirm__row">
              <dt>Payment method</dt>
              <dd>{paymentMethod?.label || 'No card on file'}</dd>
            </div>
          </dl>

          <div className="pm-modal__alert" role="note">
            <img src={InfoIcon} alt="" width="20" height="20" />
            <p>
              {paymentMethod
                ? `${plan.price} will be charged to ${paymentMethod.label} now, and an invoice will be added to your billing history.`
                : 'A primary payment method is required to change plan. Add a card under Payment Method first.'}
            </p>
          </div>

          <div className="pm-modal__actions">
            <button
              type="button"
              className="pm-modal__btn pm-modal__btn--ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              ref={cancelButtonRef}
            >
              Cancel
            </button>
            <button
              type="button"
              className="pm-modal__btn pm-modal__btn--solid"
              onClick={onConfirm}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Processing…' : `Confirm & Pay ${plan.price}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanChangeModal;
