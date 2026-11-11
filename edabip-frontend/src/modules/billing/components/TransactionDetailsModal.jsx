import { useEffect, useId, useRef } from 'react';
import CloseIcon from '../../../assets/dashboard/payment-history/ci_close-sm.svg';
import SuccessTick from '../../../assets/dashboard/payment-history/transaction-tick.svg';

function TransactionDetailsModal({ isOpen, details, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

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
    closeRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen || !details) return null;

  const isCompleted = String(details.status).toLowerCase() === 'completed';

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="ph-modal__backdrop" onClick={handleBackdropClick}>
      <div
        className="ph-modal__card ph-tx-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="ph-tx-modal__head">
          <h2 id={titleId}>Transactions Details</h2>
          <button
            type="button"
            className="ph-modal__close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close"
          >
            <img src={CloseIcon} alt="" width="30" height="30" />
          </button>
        </div>

        <div className="ph-tx-modal__hero">
          <img src={SuccessTick} alt="" width="88" height="88" />
          <p className="ph-tx-modal__amount">{details.amount}</p>
          <span className={`ph-tx-modal__badge${isCompleted ? ' is-completed' : ' is-failed'}`}>
            {details.status}
          </span>
        </div>

        <dl className="ph-tx-modal__rows">
          <div>
            <dt>Date</dt>
            <dd>{details.date}</dd>
          </div>
          <div>
            <dt>Transaction ID</dt>
            <dd>{details.transactionId}</dd>
          </div>
          <div>
            <dt>Payment Method</dt>
            <dd>{details.paymentMethod}</dd>
          </div>
          <div>
            <dt>Card Number</dt>
            <dd>{details.cardNumber}</dd>
          </div>
          <div>
            <dt>Name on Card</dt>
            <dd>{details.nameOnCard}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default TransactionDetailsModal;
