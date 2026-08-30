import React from 'react';

export function StatusBadge({ status, type = 'active_inactive', className = '' }) {
  // Types:
  // 1. 'active_inactive': true/false
  // 2. 'registration': 'registered' | 'unregistered'
  // 3. 'unregistered_status': 'pending' | 'converted' | 'inactive'

  if (type === 'active_inactive') {
    const isActive = Boolean(status);
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-600 border border-slate-200'
        } ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
        {isActive ? 'Aktif' : 'Tidak Aktif'}
      </span>
    );
  }

  if (type === 'registration') {
    const isRegistered = status === 'registered' || status === true;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isRegistered
            ? 'bg-blue-50 text-blue-700 border border-blue-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        } ${className}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isRegistered ? 'bg-blue-500' : 'bg-amber-500'
          }`}
        />
        {isRegistered ? 'Terdaftar' : 'Belum Terdaftar'}
      </span>
    );
  }

  if (type === 'unregistered_status') {
    const statusMap = {
      pending: {
        label: 'Belum Terdaftar',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dot-bg-amber-500',
        dot: 'bg-amber-500',
      },
      converted: {
        label: 'Telah Jadi Produk',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dot-bg-emerald-500',
        dot: 'bg-emerald-500',
      },
      inactive: {
        label: 'Dinonaktifkan',
        className: 'bg-slate-100 text-slate-600 border-slate-200 dot-bg-slate-400',
        dot: 'bg-slate-400',
      },
    };

    const config = statusMap[status] || statusMap.pending;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.className} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  return null;
}

export default StatusBadge;
