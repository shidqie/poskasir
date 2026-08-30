import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({
  isOpen,
  onClose,
  message,
  type = 'success', // 'success' | 'error' | 'info'
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
      icon: <CheckCircle2 className="w-5 h-5 text-white shrink-0" />,
    },
    error: {
      bg: 'bg-red-600',
      icon: <AlertCircle className="w-5 h-5 text-white shrink-0" />,
    },
    info: {
      bg: 'bg-red-700',
      icon: <Info className="w-5 h-5 text-white shrink-0" />,
    },
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slide-up max-w-sm w-full">
      <div
        className={`${config.bg} text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3`}
        role="alert"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {config.icon}
          <p className="text-sm font-medium leading-tight truncate">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default Toast;
