import { useEffect, useId, useRef, useState } from 'react';
import ChevronDown from '../../../assets/dashboard/billing/chevron-down.svg';

export function SettingsField({ id, label, error, children }) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="st-field">
      <label className="st-field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="st-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsSelect({
  id,
  label,
  value,
  options = [],
  onChange,
  error,
  disabled = false,
  ariaLabel,
  placeholder = 'Select',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const generatedId = useId();
  const fieldId = id || generatedId;
  const selected = options.find((option) => option.value === value);
  const hasValue = Boolean(selected);
  const display = selected?.label || placeholder;

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="st-field" ref={rootRef}>
      {label ? (
        <span className="st-field__label" id={`${fieldId}-label`}>
          {label}
        </span>
      ) : null}
      <button
        type="button"
        id={fieldId}
        className={`st-select${open ? ' is-open' : ''}${error ? ' is-invalid' : ''}${hasValue ? '' : ' is-placeholder'}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${fieldId}-label` : undefined}
        aria-label={ariaLabel || label}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="st-select__value">{display}</span>
        <img src={ChevronDown} alt="" width="12" height="8" />
      </button>
      {open ? (
        <ul className="st-select__menu" role="listbox" aria-label={ariaLabel || label}>
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`st-select__option${option.value === value ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="st-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ToggleSwitch({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}) {
  return (
    <div className="st-toggle-field">
      {label ? (
        <label className="st-field__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <button
        type="button"
        id={id}
        className={['st-switch', checked ? 'is-on' : '', className].filter(Boolean).join(' ')}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="st-switch__thumb" />
        <span className="st-switch__text">{checked ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}
