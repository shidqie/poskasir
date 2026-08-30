import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export function SubmissionStatusBadge({ status, showUnregisteredLabel = false, size = 'sm' }) {
  const isSmall = size === 'sm';
  const padding = isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';
  const iconSize = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';

  if (status === 'approved') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}
      >
        <CheckCircle2 className={`${iconSize} text-emerald-600`} />
        <span>Terdaftar</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${padding}`}
      >
        <XCircle className={`${iconSize} text-rose-600`} />
        <span>Ditolak</span>
      </span>
    );
  }

  // Pending
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {showUnregisteredLabel && (
        <span
          className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${padding}`}
        >
          <AlertCircle className={`${iconSize} text-amber-600`} />
          <span>Belum Terdaftar</span>
        </span>
      )}
      <span
        className={`inline-flex items-center gap-1.5 font-bold rounded-full bg-yellow-50 text-yellow-800 border border-yellow-300 animate-pulse ${padding}`}
      >
        <Clock className={`${iconSize} text-yellow-600`} />
        <span>Menunggu Persetujuan</span>
      </span>
    </div>
  );
}

export default SubmissionStatusBadge;
