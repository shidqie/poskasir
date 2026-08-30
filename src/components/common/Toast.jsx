import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export function Toast({
  isOpen,
  onClose,
  message,
  type = 'success', // 'success' | 'error' | 'warning' | 'danger' | 'info'
  duration = 3000,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isOpen, onClose, duration]);

  if (!isOpen) return null;

  const typeConfig = {
    success: {
      bg: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-600',
      icon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />,
    },
    error: {
      bg: 'bg-rose-600',
      icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />,
    },
    danger: {
      bg: 'bg-rose-600',
      icon: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />,
    },
    info: {
      bg: 'bg-slate-800',
      icon: <Info className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />,
    },
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-auto sm:bottom-5 sm:right-5 z-50 animate-in fade-in slide-in-from-top sm:slide-in-from-bottom duration-200 max-w-sm sm:w-full mx-auto sm:mx-0 pointer-events-auto">
      <div
        className={`${config.bg} text-white px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl shadow-black/10 flex items-center justify-between gap-3 border border-white/10`}
        role="alert"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {config.icon}
          <p className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
