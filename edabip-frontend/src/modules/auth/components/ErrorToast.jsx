import { useEffect } from "react";
import CautionIcon from "../../../assets/Authv2/caution-icon.svg";
import "./ErrorToast.css";

function ErrorToast({
  isOpen,
  title,
  message,
  onClose,
  duration = 7000,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    const timer = window.setTimeout(onClose, duration);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div
      className="auth-error-toast"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <img
        src={CautionIcon}
        alt=""
        className="auth-error-toast__icon"
        width="22"
        height="19"
      />
      <div className="auth-error-toast__copy">
        <p className="auth-error-toast__title">{title}</p>
        <p className="auth-error-toast__message">{message}</p>
      </div>
      <button
        type="button"
        className="auth-error-toast__close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

export default ErrorToast;
