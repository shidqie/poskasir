import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { closingService } from '@/services/closingService';
import { DoorClosed } from 'lucide-react';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

export default function ClosingListPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: closings = [], isLoading } = useQuery({
    queryKey: ['closings', { dateFrom, dateTo }],
    queryFn: () => closingService.getAllClosings({ dateFrom, dateTo }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
          <DoorClosed className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Riwayat Tutup Kasir</h1>
          <p className="text-xs sm:text-sm text-slate-500">{closings.length} data closing tercatat</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {isLoading && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Memuat riwayat closing...</p>
          </div>
        )}
        {!isLoading && closings.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <DoorClosed size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold text-slate-700">Belum ada data closing</p>
            <p className="text-xs text-slate-400 mt-1">Laporan tutup kasir dari kasir akan muncul di sini</p>
          </div>
        )}
        {closings.map((c) => {
          const diff = Number(c.difference);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-red-200 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900 text-sm sm:text-base">{c.cashier?.full_name || '—'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(c.closing_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">{c.transaction_count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="text-base sm:text-lg font-black text-slate-900">{formatRupiah(c.total_sales)}</p>
                  <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full ${diff === 0 ? 'bg-emerald-50 text-emerald-700' : diff > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                    Selisih: {diff > 0 ? '+' : ''}{formatRupiah(diff)}
                  </span>
                </div>
              </div>
              {c.notes && (
                <p className="mt-3 text-xs text-slate-600 bg-slate-50 rounded-xl p-2.5 border border-slate-100 font-medium">📝 {c.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
