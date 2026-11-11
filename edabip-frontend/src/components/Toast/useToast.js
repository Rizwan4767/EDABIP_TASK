import { useToastContext } from './ToastContext';

export const useToast = () => {
  const { showToast } = useToastContext();

  const showError = (title, message) => showToast('error', title, message);
  const showSuccess = (title, message) => showToast('success', title, message);
  const showInfo = (title, message) => showToast('info', title, message);

  return { showError, showSuccess, showInfo };
};