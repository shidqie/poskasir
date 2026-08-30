import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cashierSessionService } from '@/services/cashierSessionService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { CashierSessionStatusBadge } from '@/components/cashier/CashierSessionStatusBadge';
import {
  DoorClosed,
  DoorOpen,
  Calendar,
  Clock,
  User,
  Coins,
  CheckCircle2,
  AlertCircle,
  Banknote,
  QrCode,
  Receipt,
  Layers,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatWaktu, formatTanggalWaktu } from '@/utils/formatters';

export default function ClosingListPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['all-cashier-sessions', { dateFrom, dateTo }],
    queryFn: () => cashierSessionService.getAllSessions({ dateFrom, dateTo }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Sesi Kasir & Riwayat Closing' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Sesi Kasir & Riwayat Closing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Rekapitulasi sesi kerja, saldo awal tunai, penjualan Tunai vs QRIS, dan selisih kas &bull; {sessions.length} sesi tercatat
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/owner/closing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <DoorClosed size={14} />
            <span>Buka / Tutup Kasir</span>
          </Link>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon size={14} />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-slate-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kartu</span>
            </button>
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium bg-slate-50 focus:bg-white"
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
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium bg-slate-50 focus:bg-white"
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
                className="w-full py-2.5 text-xs font-bold rounded-xl"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="md" message="Memuat riwayat sesi kasir..." />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={DoorClosed}
            title="Belum Ada Sesi Kasir Tercatat"
            description="Laporan buka & tutup kasir dari kasir toko akan otomatis tercatat dan muncul di sini."
          />
        ) : viewMode === 'table' ? (
          /* ========================================================================= */
          /* 1. TABLE VIEW (PROMPT SECTION 22 EXACT FORMAT)                            */
          /* ========================================================================= */
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kasir</th>
                    <th className="py-3.5 px-3">Buka</th>
                    <th className="py-3.5 px-3">Tutup</th>
                    <th className="py-3.5 px-3 text-right">Saldo Awal</th>
                    <th className="py-3.5 px-3 text-right">Tunai</th>
                    <th className="py-3.5 px-3 text-right">QRIS</th>
                    <th className="py-3.5 px-3 text-right">Total</th>
                    <th className="py-3.5 px-3 text-right">Selisih</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const diff = s.cash_difference;
                    const isOpen = s.status === 'open';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Kasir */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          <div>
                            <p>{s.cashier?.full_name || 'Kasir'}</p>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              {formatTanggal(s.opened_at)}
                            </span>
                          </div>
                        </td>

                        {/* Buka */}
                        <td className="py-3.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                          {formatWaktu(s.opened_at)}
                        </td>

                        {/* Tutup */}
                        <td className="py-3.5 px-3 font-mono font-medium text-slate-600 whitespace-nowrap">
                          {s.closed_at ? formatWaktu(s.closed_at) : '— (Berjalan)'}
                        </td>

                        {/* Saldo Awal */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          {formatRupiah(s.opening_cash)}
                        </td>

                        {/* Tunai */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {formatRupiah(s.cash_sales)}
                        </td>

                        {/* QRIS */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">
                          {formatRupiah(s.qris_sales)}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatRupiah(s.total_sales)}
                        </td>

                        {/* Selisih */}
                        <td className="py-3.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          {isOpen ? (
                            <span className="text-slate-400 text-[11px]">—</span>
                          ) : diff === null || diff === undefined ? (
                            <span className="text-slate-400">—</span>
                          ) : diff === 0 ? (
                            <span className="text-emerald-700 font-bold">Sesuai (Rp 0)</span>
                          ) : diff < 0 ? (
                            <span className="text-rose-700 font-black">
                              -{formatRupiah(Math.abs(diff))} (Kurang)
                            </span>
                          ) : (
                            <span className="text-amber-700 font-black">
                              +{formatRupiah(diff)} (Lebih)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <CashierSessionStatusBadge status={s.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* 2. CARD VIEW                                                              */
          /* ========================================================================= */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => {
              const diff = s.cash_difference;
              const isOpen = s.status === 'open';

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-red-200 transition-colors"
                >
                  <div className="space-y-3">
                    {/* Header Card */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                          {s.cashier?.full_name?.charAt(0) || 'K'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 leading-tight">
                            {s.cashier?.full_name || 'Kasir'}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatTanggal(s.opened_at)}
                          </span>
                        </div>
                      </div>
                      <CashierSessionStatusBadge status={s.status} />
                    </div>

                    {/* Jam Buka & Tutup */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waktu Buka</span>
                        <span className="font-mono font-bold text-slate-700">
                          {formatWaktu(s.opened_at)} WIB
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Waktu Tutup</span>
                        <span className="font-mono font-bold text-slate-700">
                          {s.closed_at ? `${formatWaktu(s.closed_at)} WIB` : '— (Berjalan)'}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Saldo */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Saldo Awal:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatRupiah(s.opening_cash)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Penjualan Tunai:</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatRupiah(s.cash_sales)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Penjualan QRIS:</span>
                        <span className="font-mono font-bold text-red-600">
                          {formatRupiah(s.qris_sales)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1 font-bold">
                        <span className="text-slate-900">Total Penjualan:</span>
                        <span className="font-mono text-sm text-slate-900">
                          {formatRupiah(s.total_sales)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Card: Selisih Kas */}
                  {!isOpen && diff !== null && (
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
                        diff === 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : diff < 0
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <span className="text-[11px] font-sans">Selisih Kas:</span>
                      <span>
                        {diff === 0
                          ? 'Sesuai (Rp 0)'
                          : diff < 0
                          ? `-${formatRupiah(Math.abs(diff))} (Kurang)`
                          : `+${formatRupiah(diff)} (Lebih)`}
                      </span>
                    </div>
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
