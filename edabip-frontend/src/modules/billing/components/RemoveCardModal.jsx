import { useEffect, useId, useRef } from 'react';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';
// Shared modal chrome — backdrop, card, header, alert, buttons.
import './PaymentMethodModal.css';

/**
 * Confirmation step for "Remove Card".
 *
 * Removing a card detaches it at Razorpay and cannot be undone — the card has
 * to be added again through Checkout. The warning changes with what the
 * removal leaves behind: another card takes over as primary, or the org is
 * left with no way to pay its renewals.
 */
function RemoveCardModal({
  isOpen,
  method,
  remainingCount = 0,
  isSubmitting = false,
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef(null);

  // Escape closes, but not mid-request: the detach is already under way at
  // Razorpay and dismissing here would leave the user guessing.
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
    // Cancel takes focus rather than the destructive button, so Enter on an
    // opening dialog can't delete a card.
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

  if (!isOpen || !method) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) onCancel();
  };

  let warning;
  if (remainingCount === 0) {
    warning =
      'This is your only saved card. Removing it leaves no payment method on file, so renewals and plan changes will fail until you add another.';
  } else if (method.isPrimary) {
    warning =
      'This is your primary card. Another saved card is made primary automatically and will be charged for future renewals.';
  } else {
    warning = 'Your primary card is unaffected and stays on file.';
  }

  return (
    <div className="pm-modal__backdrop" onClick={handleBackdropClick}>
      <div
        className="pm-modal__card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="pm-modal__form">
          <div className="pm-modal__header">
            <div className="pm-modal__header-copy">
              <h2 id={titleId} className="pm-modal__title">
                Remove {method.label}?
              </h2>
              <p id={descriptionId} className="pm-modal__subtitle">
                This card is detached from your account and cannot be restored.
                Adding it back means entering it again through secure checkout.
              </p>
            </div>
          </div>

          <div className="pm-modal__alert" role="note">
            <img src={InfoIcon} alt="" width="20" height="20" />
            <p>{warning}</p>
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
              className="pm-modal__btn pm-modal__btn--danger"
              onClick={onConfirm}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Removing…' : 'Remove Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RemoveCardModal;
