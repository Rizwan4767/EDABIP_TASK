import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ChevronDownIcon from '../../../assets/dashboard/charts/chevron-down.svg';
import { computePanelShift } from '../DateRangePicker/computePanelShift.js';
import {
  CUSTOM_RANGE_LABEL,
  formatCustomDate,
  MONTHS_SHORT,
  parseCustomDate,
} from '../DateRangePicker/dateRange.js';
import '../DateRangePicker/DateRangePicker.css';
import './PeriodDropdown.css';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DEFAULT_CARD_PERIOD_OPTIONS = [
  'Last 3 Months',
  'Last 6 Months',
  'Last 9 Months',
  'Last 12 Months',
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getCalendarDays(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  const days = [];

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    days.push({
      date,
      inMonth: date.getMonth() === month,
    });
  }

  const lastWeek = days.slice(35);
  if (lastWeek.every((day) => !day.inMonth)) {
    return days.slice(0, 35);
  }

  return days;
}

function ChevronIcon({ direction }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === 'prev' ? 'M10 3.5L5.5 8L10 12.5' : 'M6 3.5L10.5 8L6 12.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeriodDropdown({
  value,
  defaultValue = 'Last 6 Months',
  onChange,
  options = DEFAULT_CARD_PERIOD_OPTIONS,
  ariaLabel = 'Select period',
  buttonClassName = '',
  menuClassName = '',
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value !== undefined ? value : internalValue;

  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('day');
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [panelShift, setPanelShift] = useState(0);
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  const selectedCustomDate = useMemo(() => parseCustomDate(selected), [selected]);
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const isCustomValue = Boolean(selectedCustomDate);

  useLayoutEffect(() => {
    if (!open || !showCalendar) {
      setPanelShift(0);
      return undefined;
    }

    const updateShift = () => {
      const panel = panelRef.current;
      if (panel) {
        setPanelShift(computePanelShift(panel));
      }
    };

    updateShift();
    window.addEventListener('resize', updateShift);
    return () => window.removeEventListener('resize', updateShift);
  }, [open, showCalendar, calendarView]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setShowCalendar(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelectOption = (option) => {
    if (value === undefined) setInternalValue(option);
    onChange?.(option);
    setOpen(false);
    setShowCalendar(false);
  };

  const handleOpenCalendar = () => {
    setShowCalendar(true);
    setCalendarView('day');
    setViewDate(startOfDay(selectedCustomDate || new Date()));
  };

  const handleSelectCustomDay = (date) => {
    const formatted = formatCustomDate(date);
    if (value === undefined) setInternalValue(formatted);
    onChange?.(formatted);
    setOpen(false);
    setShowCalendar(false);
  };

  const shiftView = (delta) => {
    setViewDate((current) => {
      if (calendarView === 'year') {
        return new Date(current.getFullYear() + delta * 12, current.getMonth(), 1);
      }
      if (calendarView === 'month') {
        return new Date(current.getFullYear() + delta, current.getMonth(), 1);
      }
      return new Date(current.getFullYear(), current.getMonth() + delta, 1);
    });
  };

  const yearRangeStart = Math.floor(viewDate.getFullYear() / 12) * 12;

  return (
    <div className="prd-dropdown" ref={rootRef}>
      <button
        type="button"
        className={buttonClassName || `prd-dropdown__trigger${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (!nextOpen) setShowCalendar(false);
        }}
      >
        <span>{selected}</span>
        <img
          src={ChevronDownIcon}
          alt=""
          width="16"
          height="16"
          className={`prd-dropdown__chevron${open ? ' prd-dropdown__chevron--open' : ''}`}
        />
      </button>

      {open && (
        <>
          {!showCalendar && (
            <ul
              className={menuClassName || 'prd-dropdown__menu'}
              role="listbox"
              aria-label={ariaLabel}
            >
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === selected}
                    className={`prd-dropdown__item${option === selected ? ' prd-dropdown__item--selected' : ''}`}
                    onClick={() => handleSelectOption(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
              <li className="prd-dropdown__item--custom">
                <button
                  type="button"
                  role="option"
                  aria-selected={isCustomValue}
                  className={`prd-dropdown__item${isCustomValue ? ' prd-dropdown__item--selected' : ''}`}
                  onClick={handleOpenCalendar}
                >
                  {CUSTOM_RANGE_LABEL}
                </button>
              </li>
            </ul>
          )}

          {showCalendar && (
            <div
              ref={panelRef}
              className="prd-dropdown__panel--calendar"
              style={panelShift ? { transform: `translateX(${panelShift}px)` } : undefined}
            >
              <dialog open className="drp-cal" aria-label="Choose a custom date">
                <div className="drp-cal__header">
                  <div className="drp-cal__title">
                    <button
                      type="button"
                      className={`drp-cal__month${calendarView === 'month' ? ' is-active' : ''}`}
                      aria-label="Choose month"
                      onClick={() => setCalendarView((view) => (view === 'month' ? 'day' : 'month'))}
                    >
                      {MONTHS[viewDate.getMonth()]}
                    </button>
                    <button
                      type="button"
                      className={`drp-cal__year${calendarView === 'year' ? ' is-active' : ''}`}
                      aria-label="Choose year"
                      onClick={() => setCalendarView((view) => (view === 'year' ? 'day' : 'year'))}
                    >
                      {viewDate.getFullYear()}
                    </button>
                  </div>
                  <div className="drp-cal__nav">
                    <button
                      type="button"
                      className="drp-cal__nav-btn"
                      aria-label="Previous"
                      onClick={() => shiftView(-1)}
                    >
                      <ChevronIcon direction="prev" />
                    </button>
                    <button
                      type="button"
                      className="drp-cal__nav-btn"
                      aria-label="Next"
                      onClick={() => shiftView(1)}
                    >
                      <ChevronIcon direction="next" />
                    </button>
                  </div>
                </div>

                {calendarView === 'day' && (
                  <div
                    className="drp-cal__grid"
                    role="grid"
                    aria-label={`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
                  >
                    {calendarDays.map(({ date, inMonth }) => {
                      const selectedDay = isSameDay(date, selectedCustomDate);
                      return (
                        <button
                          key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                          type="button"
                          role="gridcell"
                          aria-selected={selectedDay}
                          className={`drp-cal__day${inMonth ? '' : ' is-outside'}${selectedDay ? ' is-selected' : ''}`}
                          onClick={() => handleSelectCustomDay(date)}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                )}

                {calendarView === 'month' && (
                  <div className="drp-cal__picker" role="listbox" aria-label="Select month">
                    {MONTHS_SHORT.map((label, month) => {
                      const active = month === viewDate.getMonth();
                      return (
                        <button
                          key={label}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`drp-cal__chip${active ? ' is-selected' : ''}`}
                          onClick={() => {
                            setViewDate(new Date(viewDate.getFullYear(), month, 1));
                            setCalendarView('day');
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {calendarView === 'year' && (
                  <div className="drp-cal__picker" role="listbox" aria-label="Select year">
                    {Array.from({ length: 12 }, (_, index) => yearRangeStart + index).map((year) => {
                      const active = year === viewDate.getFullYear();
                      return (
                        <button
                          key={year}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`drp-cal__chip${active ? ' is-selected' : ''}`}
                          onClick={() => {
                            setViewDate(new Date(year, viewDate.getMonth(), 1));
                            setCalendarView('month');
                          }}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                )}
              </dialog>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PeriodDropdown;
