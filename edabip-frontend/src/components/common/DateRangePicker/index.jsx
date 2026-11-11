import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import CalendarIcon from '../../../assets/dashboard/calender-icon.svg';
import { computePanelShift } from './computePanelShift.js';
import {
  CUSTOM_RANGE_LABEL,
  DATE_RANGE_PRESETS,
  DEFAULT_DATE_RANGE,
  formatCustomDate,
  MONTHS_SHORT,
  parseCustomDate,
} from './dateRange.js';
import './DateRangePicker.css';

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

function calendarNavLabel(view, direction) {
  if (view === 'year') {
    return direction === 'prev' ? 'Previous years' : 'Next years';
  }
  if (view === 'month') {
    return direction === 'prev' ? 'Previous year' : 'Next year';
  }
  return direction === 'prev' ? 'Previous month' : 'Next month';
}

function shiftCalendarDate(current, view, delta) {
  if (view === 'year') {
    return new Date(current.getFullYear() + delta * 12, current.getMonth(), 1);
  }
  if (view === 'month') {
    return new Date(current.getFullYear() + delta, current.getMonth(), 1);
  }
  return new Date(current.getFullYear(), current.getMonth() + delta, 1);
}

function DateRangeCalendar({
  calendarView,
  viewDate,
  calendarDays,
  selectedCustomDate,
  yearRangeStart,
  prevLabel,
  nextLabel,
  onShiftView,
  onChangeView,
  onSelectDay,
  onSelectMonth,
  onSelectYear,
}) {
  return (
    <dialog open className="drp-cal" aria-label="Choose a custom date">
      <div className="drp-cal__header">
        <div className="drp-cal__title">
          <button
            type="button"
            className={`drp-cal__month${calendarView === 'month' ? ' is-active' : ''}`}
            aria-label="Choose month"
            onClick={() => onChangeView(calendarView === 'month' ? 'day' : 'month')}
          >
            {MONTHS[viewDate.getMonth()]}
          </button>
          <button
            type="button"
            className={`drp-cal__year${calendarView === 'year' ? ' is-active' : ''}`}
            aria-label="Choose year"
            onClick={() => onChangeView(calendarView === 'year' ? 'day' : 'year')}
          >
            {viewDate.getFullYear()}
          </button>
        </div>
        <div className="drp-cal__nav">
          <button type="button" className="drp-cal__nav-btn" aria-label={prevLabel} onClick={() => onShiftView(-1)}>
            <ChevronIcon direction="prev" />
          </button>
          <button type="button" className="drp-cal__nav-btn" aria-label={nextLabel} onClick={() => onShiftView(1)}>
            <ChevronIcon direction="next" />
          </button>
        </div>
      </div>

      {calendarView === 'day' ? (
        <div className="drp-cal__grid" role="grid" aria-label={`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}>
          {calendarDays.map(({ date, inMonth }) => {
            const selected = isSameDay(date, selectedCustomDate);
            return (
              <button
                key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                type="button"
                role="gridcell"
                aria-selected={selected}
                className={`drp-cal__day${inMonth ? '' : ' is-outside'}${selected ? ' is-selected' : ''}`}
                onClick={() => onSelectDay(date)}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      ) : null}

      {calendarView === 'month' ? (
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
                onClick={() => onSelectMonth(month)}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {calendarView === 'year' ? (
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
                onClick={() => onSelectYear(year)}
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : null}
    </dialog>
  );
}

function DateRangePicker({
  value = DEFAULT_DATE_RANGE,
  onChange,
  ariaLabel = 'Select date range',
  presets = DATE_RANGE_PRESETS,
}) {
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState('day');
  const [viewDate, setViewDate] = useState(() => startOfDay(new Date()));
  const [panelShift, setPanelShift] = useState(0);
  const rootRef = useRef(null);
  const panelRef = useRef(null);

  useLayoutEffect(() => {
    if (!open) {
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

  const selectedCustomDate = useMemo(() => parseCustomDate(value), [value]);
  const calendarDays = useMemo(() => getCalendarDays(viewDate), [viewDate]);
  const isCustomValue = Boolean(selectedCustomDate);
  const displayValue = value || DEFAULT_DATE_RANGE;

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setShowCalendar(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowCalendar(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openPicker = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      setShowCalendar(false);
      setCalendarView('day');
      setViewDate(startOfDay(parseCustomDate(value) || new Date()));
    } else {
      setShowCalendar(false);
    }
  };

  const selectPreset = (option) => {
    onChange?.(option);
    setShowCalendar(false);
    setOpen(false);
  };

  const selectCustomDay = (date) => {
    onChange?.(formatCustomDate(date));
    setShowCalendar(false);
    setOpen(false);
  };

  const shiftView = (delta) => {
    setViewDate((current) => shiftCalendarDate(current, calendarView, delta));
  };

  const yearRangeStart = Math.floor(viewDate.getFullYear() / 12) * 12;
  const prevLabel = calendarNavLabel(calendarView, 'prev');
  const nextLabel = calendarNavLabel(calendarView, 'next');

  return (
    <div className="drp" ref={rootRef}>
      <button
        type="button"
        className={`drp__trigger${open ? ' is-open' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={openPicker}
      >
        <img src={CalendarIcon} alt="" width="16" height="16" />
        <span className="drp__label">{displayValue}</span>
      </button>

      {open ? (
        <div
          ref={panelRef}
          className={`drp__panel${showCalendar ? ' drp__panel--calendar' : ''}`}
          style={panelShift ? { transform: `translateX(${panelShift}px)` } : undefined}
        >
          {showCalendar ? null : (
            <ul className="drp__menu" role="listbox" aria-label={ariaLabel}>
              {presets.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    className={`drp__option${option === value ? ' is-active' : ''}`}
                    onClick={() => selectPreset(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCustomValue}
                  className={`drp__option${isCustomValue ? ' is-active' : ''}`}
                  onClick={() => {
                    setShowCalendar(true);
                    setCalendarView('day');
                    setViewDate(startOfDay(selectedCustomDate || new Date()));
                  }}
                >
                  {CUSTOM_RANGE_LABEL}
                </button>
              </li>
            </ul>
          )}

          {showCalendar ? (
            <DateRangeCalendar
              calendarView={calendarView}
              viewDate={viewDate}
              calendarDays={calendarDays}
              selectedCustomDate={selectedCustomDate}
              yearRangeStart={yearRangeStart}
              prevLabel={prevLabel}
              nextLabel={nextLabel}
              onShiftView={shiftView}
              onChangeView={setCalendarView}
              onSelectDay={selectCustomDay}
              onSelectMonth={(month) => {
                setViewDate(new Date(viewDate.getFullYear(), month, 1));
                setCalendarView('day');
              }}
              onSelectYear={(year) => {
                setViewDate(new Date(year, viewDate.getMonth(), 1));
                setCalendarView('month');
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default DateRangePicker;
