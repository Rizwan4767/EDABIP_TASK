import { useEffect } from 'react';
import SuccessCheckIcon from '../../../assets/dashboard/users/toast-check.svg';
import './UserManagementModals.css';

function SuccessToast({ isOpen, title, message, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    const timer = window.setTimeout(onClose, duration);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.clearTimeout(timer);
    };
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  return (
    <div
      className="um-toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <img src={SuccessCheckIcon} alt="" className="um-toast__icon" width="24" height="24" />
      <div className="um-toast__copy">
        <p className="um-toast__title">{title}</p>
        <p className="um-toast__message">{message}</p>
      </div>
      <button
        type="button"
        className="um-toast__close"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  );
}

export default SuccessToast;
