import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function CashMovementBadge({ type }) {
  if (type === 'cash_in') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
        <ArrowDownLeft size={12} className="text-emerald-600" />
        <span>Kas Masuk</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-900 border border-rose-300">
      <ArrowUpRight size={12} className="text-rose-700" />
      <span>Kas Keluar</span>
    </span>
  );
}

export default CashMovementBadge;
