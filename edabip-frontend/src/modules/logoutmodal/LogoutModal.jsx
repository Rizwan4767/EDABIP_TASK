import { useEffect, useRef } from 'react';
import AlertIcon from '../../assets/dashboard/Sidebar/AlertIcon.svg';
import '../logoutmodal/LogoutModal.css';

function LogoutPopup({
  isOpen,
  titleId,
  title,
  message,
  noteTitle,
  noteBody,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

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
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="db-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
    >
      <dialog
        open
        className="db-modal__card"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          onCancel();
        }}
      >
        <div className="db-modal__header">
          <div className="db-modal__header-block">
            <h2 id={titleId} className="db-modal__title">{title}</h2>
            <p className="db-modal__message">{message}</p>
          </div>

          <button
            type="button"
            className="db-modal__close"
            aria-label="Close dialog"
            onClick={onCancel}
            ref={closeButtonRef}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="db-modal__alert" role="note">
          <span className="db-modal__alert-icon" aria-hidden="true">
            <img src={AlertIcon} alt="" width="20" height="20" />
          </span>
          <div className="db-modal__alert-copy">
            <p className="db-modal__alert-title">{noteTitle}</p>
            <p className="db-modal__alert-body">{noteBody}</p>
          </div>
        </div>

        <div className="db-modal__actions">
          <button type="button" className="db-modal__btn db-modal__btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="db-modal__btn db-modal__btn--solid" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default LogoutPopup;