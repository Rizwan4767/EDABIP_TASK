import { useEffect, useRef } from 'react';
import './UserManagementModals.css';

function UserDialog({
  isOpen,
  onClose,
  titleId,
  describedBy,
  className = '',
  children,
}) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

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
      'input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    const focusTarget =
      firstField ||
      closeButtonRef.current ||
      dialogRef.current?.querySelector(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );

    focusTarget?.focus();

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
      onClose();
    }
  };

  return (
    <div
      className="um-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <dialog
        open
        className={`um-modal__card ${className}`.trim()}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          onClose();
        }}
      >
        {typeof children === 'function' ? children({ closeButtonRef }) : children}
      </dialog>
    </div>
  );
}

export default UserDialog;
