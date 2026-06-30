import { useApp } from '../context/AppContext';

export const useToast = () => {
  const { addToast, removeToast, toasts } = useApp();
  const success = (msg) => addToast(msg, 'success');
  const error = (msg) => addToast(msg, 'error');
  const warning = (msg) => addToast(msg, 'warning');
  const info = (msg) => addToast(msg, 'info');
  return { success, error, warning, info, toasts, removeToast };
};
