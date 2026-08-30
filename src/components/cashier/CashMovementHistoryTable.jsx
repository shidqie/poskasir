import React from 'react';
import { CashMovementBadge } from './CashMovementBadge';
import { formatRupiah, formatWaktu, formatTanggalWaktu } from '@/utils/formatters';
import { EmptyState } from '@/components/common/EmptyState';
import { Coins, User, FileText, Calendar } from 'lucide-react';

export function CashMovementHistoryTable({ movements = [] }) {
  if (!movements || movements.length === 0) {
    return (
      <div className="py-6 px-4 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
        <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-600">Belum Ada Riwayat Kas</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Pengambilan uang (kas keluar) atau kas masuk pada sesi ini akan tercatat di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
              <th className="py-2.5 px-3">Waktu</th>
              <th className="py-2.5 px-3">Jenis</th>
              <th className="py-2.5 px-3">Keperluan</th>
              <th className="py-2.5 px-3">Oleh</th>
              <th className="py-2.5 px-3 text-right">Nominal</th>
              <th className="py-2.5 px-3">Dicatat Oleh</th>
              <th className="py-2.5 px-3">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {movements.map((m) => {
              const isOut = m.movement_type === 'cash_out';
              return (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-600">
                    {formatWaktu(m.created_at)}
                  </td>
                  <td className="py-2.5 px-3">
                    <CashMovementBadge type={m.movement_type} />
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {m.category}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">
                    {m.person_name}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-black font-mono text-sm ${
                      isOut ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {isOut ? '− ' : '+ '}
                    {formatRupiah(m.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {m.recorder?.full_name || 'Kasir'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px] italic max-w-xs truncate">
                    {m.notes || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="sm:hidden divide-y divide-slate-100 bg-white">
        {movements.map((m) => {
          const isOut = m.movement_type === 'cash_out';
          return (
            <div key={m.id} className="p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CashMovementBadge type={m.movement_type} />
                  <span className="font-mono text-slate-400 text-[11px]">
                    {formatWaktu(m.created_at)}
                  </span>
                </div>
                <span
                  className={`font-black font-mono text-sm ${
                    isOut ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {isOut ? '− ' : '+ '}
                  {formatRupiah(m.amount)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-700 pt-0.5">
                <span className="font-bold">{m.category}</span>
                <span className="text-slate-500">Oleh: <strong>{m.person_name}</strong></span>
              </div>

              {m.notes && (
                <p className="text-[11px] text-slate-400 italic">
                  Catatan: {m.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CashMovementHistoryTable;
