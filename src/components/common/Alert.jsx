import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Alert({
  variant = 'info', // 'info' | 'success' | 'warning' | 'danger'
  title,
  children,
  onDismiss,
  className = '',
}) {
  const config = {
    info: {
      bg: 'bg-red-50/80 border-red-200 text-red-900',
      icon: <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
      titleColor: 'text-red-950 font-bold',
      bodyColor: 'text-red-800',
    },
    success: {
      bg: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-950 font-bold',
      bodyColor: 'text-emerald-800',
    },
    warning: {
      bg: 'bg-amber-50/80 border-amber-200 text-amber-900',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
      titleColor: 'text-amber-950 font-bold',
      bodyColor: 'text-amber-800',
    },
    danger: {
      bg: 'bg-rose-50/80 border-rose-200 text-rose-900',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
      titleColor: 'text-rose-950 font-bold',
      bodyColor: 'text-rose-800',
    },
  };

  const current = config[variant] || config.info;

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${current.bg} ${className}`}
    >
      {current.icon}
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm leading-tight mb-1 ${current.titleColor}`}>{title}</p>}
        <div className={`text-xs leading-relaxed ${current.bodyColor}`}>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-900 transition-colors"
          aria-label="Tutup pemberitahuan"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
