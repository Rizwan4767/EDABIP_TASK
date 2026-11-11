import { useEffect } from "react";
import "./Modal.css";

function Modal({ isOpen, onClose, children, ariaLabel, overlayClassName }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={overlayClassName ? `cm-modal-overlay ${overlayClassName}` : "cm-modal-overlay"}
      onClick={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          onClose?.();
        }
      }}
      role="presentation"
    >
      <dialog
        open
        className="cm-modal"
        aria-modal="true"
        aria-label={ariaLabel}
        onCancel={(event) => {
          event.preventDefault();
          onClose?.();
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </dialog>
    </div>
  );
}

export default Modal;
