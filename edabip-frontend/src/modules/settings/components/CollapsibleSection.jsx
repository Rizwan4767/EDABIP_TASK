import { useId, useState } from 'react';
import ChevronDown from '../../../assets/dashboard/charts/chevron-down.svg';

function CollapsibleSection({ id, title, description, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  const headingId = useId();

  return (
    <section className="st-card" id={id} aria-labelledby={headingId}>
      <header className={`st-card__header${description ? ' st-card__header--stack' : ''}`}>
        <div className="st-card__heading">
          <h2 id={headingId}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        <button
          type="button"
          className={`st-collapse${open ? ' is-open' : ''}`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
        >
          <img src={ChevronDown} alt="" width="16" height="16" />
          <span className="visually-hidden">{open ? `Collapse ${title}` : `Expand ${title}`}</span>
        </button>
      </header>
      <div id={panelId} hidden={!open} className="st-card__body">
        {children}
      </div>
    </section>
  );
}

export default CollapsibleSection;
