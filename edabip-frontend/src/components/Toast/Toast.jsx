import { useEffect } from 'react';
import './Toast.css';
import warningIcon from "../Toast/Vector.svg";

const TOAST_ICONS = {
  error: null,
  success: '✅',
  info: 'ℹ️',
};

const Toast = ({ type = 'error', title, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icon = type === 'error'
    ? <img src={warningIcon} alt="Warning " />
    : (TOAST_ICONS[type] || TOAST_ICONS.info);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">
        {icon}
      </div>
      <div className="toast-content">
        <p className="toast-title">{title}</p>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;