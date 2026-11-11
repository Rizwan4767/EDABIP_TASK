import { useState, useEffect, useRef } from 'react';
import ChevronDown from '../../../assets/dashboard/tableau/chevron-down.svg';

export default function DropdownSelect({
  value,
  options,
  onChange,
  icon,
  className = '',
  buttonClassName = '',
  ariaLabel,
  showChevron = true,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className={`rep-dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`rep-welcome-btn ${buttonClassName}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon ? <img src={icon} alt="" width="14" height="14" /> : null}
        <span className="rep-dropdown__label">{value}</span>
        {showChevron ? (
          <img src={ChevronDown} className="tb-btn__chevron" alt="" width="10" height="6" />
        ) : null}
      </button>
      {open ? (
        <ul className="rep-dropdown__menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                role="option"
                aria-selected={option === value}
                className={`rep-dropdown__option${option === value ? ' rep-dropdown__option--active' : ''}`}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
