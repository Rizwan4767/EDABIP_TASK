import { useEffect, useRef, useState } from 'react';
import { exportTable } from '../../../utils/exportUtils.js';
import './ExportMenu.css';

const EXPORT_FORMATS = [
  { id: 'pdf', label: 'PDF' },
  { id: 'csv', label: 'CSV' },
  { id: 'word', label: 'Word' },
];

function ExportMenu({
  iconSrc,
  icon,
  iconClassName,
  iconWidth = 14,
  iconHeight = 14,
  buttonClassName = 'db-btn db-btn--solid',
  label = 'Export',
  filename = 'export',
  title = 'Export',
  columns = [],
  rows = [],
  onExport,
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

  const handleSelect = (format) => {
    setOpen(false);
    if (onExport) {
      onExport(format);
      return;
    }
    exportTable({ format, filename, title, columns, rows });
  };

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {icon
          ? icon
          : iconSrc
            ? (
                <img
                  src={iconSrc}
                  alt=""
                  className={iconClassName}
                  width={iconWidth}
                  height={iconHeight}
                />
              )
            : null}
        {label}
      </button>
      {open ? (
        <ul className="export-menu__list" role="menu" aria-label="Export format">
          {EXPORT_FORMATS.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className="export-menu__item"
                onClick={() => handleSelect(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ExportMenu;
