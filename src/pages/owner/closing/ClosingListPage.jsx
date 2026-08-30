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
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <DoorClosed size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Riwayat Tutup Kasir</h1>
            <p className="text-xs text-gray-500">{closings.length} closing ditemukan</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-2">
        {isLoading && (
          <div className="text-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          </div>
        )}
        {!isLoading && closings.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <DoorClosed size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Belum ada data closing</p>
          </div>
        )}
        {closings.map((c) => {
          const diff = Number(c.difference);
          return (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{c.cashier?.full_name || '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(c.closing_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.transaction_count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{formatRupiah(c.total_sales)}</p>
                  <span className={`text-xs font-bold ${diff === 0 ? 'text-green-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    Selisih: {diff > 0 ? '+' : ''}{formatRupiah(diff)}
                  </span>
                </div>
              </div>
              {c.notes && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">📝 {c.notes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
