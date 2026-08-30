import React from 'react';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export function DebtStatusBadge({ status, remainingAmount = 0 }) {
  if (status === 'paid' || remainingAmount <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 size={12} className="text-emerald-600" />
        <span>Lunas</span>
      </span>
    );
  }

  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
        <Clock size={12} className="text-amber-700" />
        <span>Dibayar Sebagian</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300">
      <AlertCircle size={12} className="text-rose-700" />
      <span>Belum Lunas</span>
    </span>
  );
}

export default DebtStatusBadge;
