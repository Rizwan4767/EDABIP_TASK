import { useEffect, useId, useRef, useState } from 'react';
import InfoIcon from '../../../assets/dashboard/users/info-icon.svg';
import VisaIcon from '../../../assets/dashboard/billing/visa-icon.svg';
import MastercardIcon from '../../../assets/dashboard/billing/mastercard-icon.svg';
import {
  buildPaymentMethod,
  detectCardBrand,
  digitsOnly,
  formatCardNumber,
  formatCvc,
  formatExpiry,
  maskedCardNumber,
  validatePaymentForm,
} from '../utils/paymentCard.js';
import './PaymentMethodModal.css';

const EMPTY_FORM = {
  name: '',
  number: '',
  expiry: '',
  cvc: '',
  setPrimary: true,
};

function PaymentMethodModal({ isOpen, onClose, onSave, makePrimary = true }) {
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState({ message: '', field: '' });

  useEffect(() => {
    if (!isOpen) return;

    setForm({ ...EMPTY_FORM, setPrimary: makePrimary });
    setError({ message: '', field: '' });
  }, [isOpen, makePrimary]);

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
    const firstField = dialogRef.current?.querySelector(
      'input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    (firstField || closeButtonRef.current)?.focus();

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

  const digits = digitsOnly(form.number);
  const brand = detectCardBrand(digits);
  const brandSrc = brand === 'mastercard' ? MastercardIcon : VisaIcon;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleChange = (field) => (event) => {
    const { value, type, checked } = event.target;
    setError({ message: '', field: '' });

    setForm((prev) => {
      if (type === 'checkbox') return { ...prev, [field]: checked };
      if (field === 'number') return { ...prev, number: formatCardNumber(value) };
      if (field === 'expiry') return { ...prev, expiry: formatExpiry(value) };
      if (field === 'cvc') return { ...prev, cvc: formatCvc(value) };
      return { ...prev, [field]: value };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextError = validatePaymentForm(form);
    if (nextError.message) {
      setError(nextError);
      return;
    }

    onSave(
      buildPaymentMethod({
        number: form.number,
        expiry: form.expiry,
        name: form.name,
        isPrimary: makePrimary || form.setPrimary,
      })
    );
  };

  return (
    <div
      className="pm-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <dialog
        open
        className="pm-modal__card"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        <form className="pm-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="pm-modal__header">
            <div className="pm-modal__header-copy">
              <h2 id={titleId} className="pm-modal__title">
                Add Payment Method
              </h2>
              <p id={descriptionId} className="pm-modal__subtitle">
                Add a card to pay invoices and keep your subscription current.
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

          <div className="pm-modal__preview" aria-hidden="true">
            <div className="pm-modal__preview-top">
              <span className="pm-modal__chip" />
              <img src={brandSrc} alt="" width="46" height="30" />
            </div>
            <p className="pm-modal__preview-number">{maskedCardNumber(digits)}</p>
            <div className="pm-modal__preview-meta">
              <span>{form.name.trim() || 'CARDHOLDER NAME'}</span>
              <span>{form.expiry || 'MM/YYYY'}</span>
            </div>
          </div>

          <div className="pm-modal__alert" role="note">
            <img src={InfoIcon} alt="" width="20" height="20" />
            <p>
              Only the last four digits are saved to your account. The full card
              number and CVC are not stored.
            </p>
          </div>

          <label className="pm-modal__field" htmlFor="pm-card-name">
            <span>Name on card</span>
            <input
              id="pm-card-name"
              name="name"
              type="text"
              autoComplete="cc-name"
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Name as it appears on the card"
              aria-invalid={error.field === 'name'}
              aria-describedby={error.field === 'name' ? errorId : undefined}
            />
          </label>

          <label className="pm-modal__field" htmlFor="pm-card-number">
            <span>Card number</span>
            <input
              id="pm-card-number"
              name="number"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              spellCheck="false"
              value={form.number}
              onChange={handleChange('number')}
              placeholder="ACCT-000015"
              aria-invalid={error.field === 'number'}
              aria-describedby={error.field === 'number' ? errorId : undefined}
            />
          </label>

          <div className="pm-modal__row">
            <label className="pm-modal__field" htmlFor="pm-card-expiry">
              <span>Expiry date</span>
              <input
                id="pm-card-expiry"
                name="expiry"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={form.expiry}
                onChange={handleChange('expiry')}
                placeholder="MM/YYYY"
                aria-invalid={error.field === 'expiry'}
                aria-describedby={error.field === 'expiry' ? errorId : undefined}
              />
            </label>

            <label className="pm-modal__field" htmlFor="pm-card-cvc">
              <span>CVC</span>
              <input
                id="pm-card-cvc"
                name="cvc"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                value={form.cvc}
                onChange={handleChange('cvc')}
                placeholder="123"
                aria-invalid={error.field === 'cvc'}
                aria-describedby={error.field === 'cvc' ? errorId : undefined}
              />
            </label>
          </div>

          {!makePrimary ? (
            <label className="pm-modal__check" htmlFor="pm-card-primary">
              <input
                id="pm-card-primary"
                name="setPrimary"
                type="checkbox"
                checked={form.setPrimary}
                onChange={handleChange('setPrimary')}
              />
              <span>Set as primary payment method</span>
            </label>
          ) : null}

          {error.message ? (
            <p className="pm-modal__error" id={errorId} role="alert">
              {error.message}
            </p>
          ) : null}

          <div className="pm-modal__actions">
            <button type="button" className="pm-modal__btn pm-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="pm-modal__btn pm-modal__btn--solid">
              Save Card
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}

export default PaymentMethodModal;
