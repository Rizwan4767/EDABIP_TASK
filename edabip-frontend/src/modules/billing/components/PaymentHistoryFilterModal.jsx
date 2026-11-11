import { useEffect, useId, useRef, useState } from 'react';
import CloseIcon from '../../../assets/dashboard/payment-history/ci_close-sm.svg';
import CalendarIcon from '../../../assets/dashboard/billing/calendar.svg';

const PRESETS = [
  { id: 1, label: '1 Months' },
  { id: 3, label: '3 Months' },
  { id: 6, label: '6 Months' },
  { id: 12, label: '12 Months' },
];

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatDisplayDate(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
}

function monthsAgo(months) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
}

function DateField({ id, label, value, onChange }) {
  return (
    <div className="ph-filter__field">
      <label htmlFor={id}>{label}</label>
      <div className={`ph-filter__date${!value ? ' is-empty' : ''}`}>
        <span>{value ? formatDisplayDate(value) : 'DD-MM-YYYY'}</span>
        <span className="ph-filter__cal" aria-hidden="true">
          <img src={CalendarIcon} alt="" width="16" height="16" />
        </span>
        <input
          id={id}
          type="date"
          value={value ? toIsoDate(value) : ''}
          onChange={(event) => onChange(fromIsoDate(event.target.value))}
        />
      </div>
    </div>
  );
}

function PaymentHistoryFilterModal({ isOpen, value, onApply, onClose }) {
  const titleId = useId();
  const fromId = useId();
  const toId = useId();
  const closeRef = useRef(null);
  const [from, setFrom] = useState(value?.from ?? null);
  const [to, setTo] = useState(value?.to ?? null);
  const [preset, setPreset] = useState(value?.preset ?? null);

  useEffect(() => {
    if (!isOpen) return undefined;
    setFrom(value?.from ?? null);
    setTo(value?.to ?? null);
    setPreset(value?.preset ?? null);
    return undefined;
  }, [isOpen, value]);

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

  if (!isOpen) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const applyPreset = (months) => {
    setPreset(months);
    setFrom(monthsAgo(months));
    setTo(new Date());
  };

  const resetAll = () => {
    setFrom(null);
    setTo(null);
    setPreset(null);
  };

  return (
    <div className="ph-modal__backdrop" onClick={handleBackdropClick}>
      <form
        className="ph-modal__card ph-filter"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault();
          onApply({ from, to, preset });
        }}
      >
        <div className="ph-filter__head">
          <h2 id={titleId}>Custom Date :</h2>
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

        <div className="ph-filter__dates">
          <DateField id={fromId} label="From" value={from} onChange={(next) => { setFrom(next); setPreset(null); }} />
          <DateField id={toId} label="To" value={to} onChange={(next) => { setTo(next); setPreset(null); }} />
        </div>

        <div className="ph-filter__presets" role="group" aria-label="Date range presets">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`ph-filter__preset${preset === item.id ? ' is-active' : ''}`}
              onClick={() => applyPreset(item.id)}
              aria-pressed={preset === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="ph-filter__actions">
          <button type="button" className="ph-filter__reset" onClick={resetAll}>
            Reset All
          </button>
          <button type="submit" className="ph-filter__apply">
            Apply Filter
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentHistoryFilterModal;
