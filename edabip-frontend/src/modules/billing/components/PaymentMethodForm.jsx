import { useEffect, useRef, useState } from 'react';
import VisaIcon from '../../../assets/dashboard/billing/visa-icon.svg';
import MastercardIcon from '../../../assets/dashboard/billing/mastercard-icon.svg';

function RowMenu({ method, onRemove, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) onClose();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="bl-payment__menu-list"
      ref={menuRef}
      role="menu"
      aria-label={`${method.label} actions`}
    >
      <button
        type="button"
        role="menuitem"
        className="bl-payment__menu-item bl-payment__menu-item--danger"
        onClick={() => {
          onClose();
          onRemove?.(method.id);
        }}
      >
        Remove
      </button>
    </div>
  );
}

function brandIcon(method) {
  const brand = method.brand?.toLowerCase();
  if (method.method === 'card' || !method.method) {
    if (brand === 'mastercard') return { type: 'image', src: MastercardIcon, alt: 'Mastercard' };
    if (brand === 'visa' || brand === 'card') return { type: 'image', src: VisaIcon, alt: 'Visa' };
  }
  const initials = (method.brand || method.method || 'PM')
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PM';
  return { type: 'mark', initials, alt: method.brand || 'Payment method' };
}

function PaymentMethodForm({
  methods = [],
  onAddCard,
  isAddingCard = false,
  onSetPrimary,
  onRemove,
  removingId = null,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  // A row that is being removed loses its menu — reopening it would only offer
  // an action already in flight.
  useEffect(() => {
    if (removingId !== null && openMenuId === removingId) setOpenMenuId(null);
  }, [removingId, openMenuId]);

  return (
    <section className="bl-card bl-payment" aria-label="Payment method">
      <h3>Payment Method</h3>

      <div className="bl-payment__list">
        {methods.map((method) => {
          const isRemoving = method.id === removingId;
          const icon = brandIcon(method);
          return (
            <article
              key={method.id}
              className={`bl-payment__row${isRemoving ? ' is-removing' : ''}`}
              aria-busy={isRemoving}
            >
              <button
                type="button"
                className={`bl-payment__radio ${
                  method.isPrimary ? 'is-selected' : ''
                }`}
                aria-label={
                  method.isPrimary
                    ? `${method.label} is primary`
                    : `Set ${method.label} as primary`
                }
                disabled={isRemoving}
                onClick={() => onSetPrimary?.(method.id)}
              >
                <span />
              </button>

              <div className="bl-payment__brand">
                {icon.type === 'image' ? (
                  <img src={icon.src} alt={icon.alt} />
                ) : (
                  <span className="bl-payment__brand-mark" aria-label={icon.alt}>
                    {icon.initials}
                  </span>
                )}
              </div>

              <div className="bl-payment__meta">
                <p>{method.label}</p>
                <span>
                  {isRemoving ? 'Removing…' : method.expiry}
                  {!isRemoving && method.method === 'card' && !method.isChargeable && (
                    <span className="bl-payment__badge">
                      Test card
                    </span>
                  )}
                </span>
              </div>

              <button
                type="button"
                className={`bl-payment__primary ${
                  method.isPrimary ? 'is-primary' : ''
                }`}
                disabled={isRemoving}
                onClick={() => onSetPrimary?.(method.id)}
              >
                {method.isPrimary ? 'Primary' : 'Set as Primary'}
              </button>

              <div className="bl-payment__actions">
                <button
                  type="button"
                  className="bl-payment__menu"
                  aria-label={`More options for ${method.label}`}
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === method.id}
                  disabled={isRemoving}
                  onClick={() =>
                    setOpenMenuId((prev) => (prev === method.id ? null : method.id))
                  }
                >
                  <span />
                  <span />
                  <span />
                </button>
                {openMenuId === method.id ? (
                  <RowMenu
                    method={method}
                    onRemove={onRemove}
                    onClose={() => setOpenMenuId(null)}
                  />
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {/*
        The card is collected by Razorpay Checkout, not by us — this button
        opens their overlay rather than a form of our own, so no card number
        ever passes through this app.
      */}
      <button
        type="button"
        className="bl-payment__add"
        onClick={onAddCard}
        disabled={isAddingCard}
        aria-busy={isAddingCard}
      >
        <span>+</span>
        {isAddingCard ? 'Opening Secure Checkout…' : 'Add New Payment Method'}
      </button>
    </section>
  );
}

export default PaymentMethodForm;
