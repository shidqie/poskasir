import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { closingService } from '@/services/closingService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DoorClosed, DoorOpen, Calendar, Clock, User, Coins, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatRupiah, formatTanggal, formatWaktu } from '@/utils/formatters';

export default function ClosingListPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: closings = [], isLoading } = useQuery({
    queryKey: ['closings', { dateFrom, dateTo }],
    queryFn: () => closingService.getAllClosings({ dateFrom, dateTo }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Riwayat Tutup Kasir' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <DoorClosed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Riwayat Tutup Kasir</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Laporan shift dan rekonsiliasi kas seluruh kasir toko &bull; {closings.length} data closing tercatat
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tanggal */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium bg-slate-50 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium bg-slate-50 focus:bg-white"
            />
          </div>
          {(dateFrom || dateTo) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                className="w-full py-2.5 text-xs font-bold"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* List Closings */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="md" message="Memuat riwayat tutup kasir..." />
          </div>
        ) : closings.length === 0 ? (
          <EmptyState
            icon={DoorClosed}
            title="Belum Ada Riwayat Tutup Kasir"
            description="Laporan buka & tutup kasir dari kasir toko akan otomatis tercatat dan muncul di sini."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closings.map((c) => {
              const diff = Number(c.difference || 0);
              const isOpen = c.status === 'open';

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-red-300 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {c.cashier?.full_name || 'Kasir'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isOpen ? 'Shift Aktif' : 'Shift Ditutup'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">
                        {formatTanggal(c.closing_date)} &bull; {formatWaktu(c.closed_at || c.opened_at)} WIB
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 font-mono leading-tight">
                        {formatRupiah(c.total_sales)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                        {c.transaction_count || 0} Transaksi
                      </p>
                    </div>
                  </div>

                  {/* Rincian Kas Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Modal Awal</span>
                      <span className="font-black text-slate-800 font-mono">{formatRupiah(c.opening_cash)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Kas Aktual</span>
                      <span className="font-black text-slate-800 font-mono">{formatRupiah(c.actual_cash)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Selisih</span>
                      <span
                        className={`font-black font-mono ${
                          diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}
                        {formatRupiah(diff)}
                      </span>
                    </div>
                  </div>

                  {c.notes && (
                    <p className="text-xs text-slate-600 bg-amber-50/60 rounded-xl p-2.5 border border-amber-100 font-medium">
                      📝 {c.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
