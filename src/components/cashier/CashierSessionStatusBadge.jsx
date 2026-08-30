import React from 'react';
import { DoorOpen, DoorClosed, Clock, CheckCircle2 } from 'lucide-react';

export function CashierSessionStatusBadge({ status, size = 'sm' }) {
  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  const iconSize = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (status === 'open') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse ${padding}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>Sesi Aktif</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${padding}`}
    >
      <DoorClosed className={iconSize} />
      <span>Ditutup</span>
    </span>
  );
}

export default CashierSessionStatusBadge;
