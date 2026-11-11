import { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AlertIcon from "../../../assets/dashboard/Sidebar/AlertIcon.svg";
import { SETTINGS_GENERAL_HASH } from "../utils/constants.js";
import "./UpdateProfileModal.css";

function UpdateProfileModal({ isOpen, onDismiss }) {
  const navigate = useNavigate();
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onDismiss]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previouslyFocused = document.activeElement;
    closeButtonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onDismiss();
    }
  };

  const handleCompleteProfile = () => {
    onDismiss();
    navigate(`/settings${SETTINGS_GENERAL_HASH}`);
  };

  return (
    <div
      className="upm-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onDismiss();
      }}
    >
      <dialog
        open
        className="upm-card"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          onDismiss();
        }}
      >
        <div className="upm-header">
          <div className="upm-header-copy">
            <h2 id={titleId} className="upm-title">
              Update Your Full Profile
            </h2>
            <p id={descriptionId} className="upm-subtitle">
              Complete your profile to get a more personalized experience.
            </p>
          </div>

          <button
            type="button"
            className="upm-close"
            aria-label="Close dialog"
            onClick={onDismiss}
            ref={closeButtonRef}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="upm-alert" role="note">
          <span className="upm-alert-icon" aria-hidden="true">
            <img src={AlertIcon} alt="" width="20" height="20" />
          </span>
          <div className="upm-alert-copy">
            <p className="upm-alert-title">Your profile is incomplete</p>
            <p className="upm-alert-body">
              Add your remaining details to keep your profile up to date and get
              relevant insights, notifications, and resources.
            </p>
          </div>
        </div>

        <div className="upm-actions">
          <button
            type="button"
            className="upm-btn upm-btn--ghost"
            onClick={onDismiss}
          >
            Remind Me Later
          </button>
          <button
            type="button"
            className="upm-btn upm-btn--solid"
            onClick={handleCompleteProfile}
          >
            Complete Profile
          </button>
        </div>
      </dialog>
    </div>
  );
}

export default UpdateProfileModal;
