import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const typeConfig = {
  success: {
    bg: 'bg-green-500',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-red-500',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-blue-500',
    icon: Info,
  },
};

export function Toast({ id, message, type = 'info', onClose }) {
  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[280px] max-w-sm',
        'animate-[slideInRight_0.3s_ease-out]',
        config.bg,
      ].join(' ')}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 ml-1 p-0.5 rounded hover:bg-white/20 transition-colors duration-150"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts.length) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

export default Toast;
