import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cashMovementService } from '@/services/cashMovementService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { StatCard } from '@/components/common/StatCard';
import { CashMovementBadge } from '@/components/cashier/CashMovementBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/common/Button';
import { formatRupiah, formatTanggalWaktu, formatTanggal } from '@/utils/formatters';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
} from 'lucide-react';

export function OwnerCashMovementsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [categorySearch, setCategorySearch] = useState('');

  const { data: movements = [], isLoading, refetch } = useQuery({
    queryKey: ['all-cash-movements', { dateFrom, dateTo, movementType, category: categorySearch }],
    queryFn: () =>
      cashMovementService.getAllCashMovements({
        dateFrom,
        dateTo,
        movementType,
        category: categorySearch,
      }),
  });

  const totalCashOut = movements
    .filter((m) => m.movement_type === 'cash_out')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  const totalCashIn = movements
    .filter((m) => m.movement_type === 'cash_in')
    .reduce((sum, m) => sum + Number(m.amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Owner Dashboard', path: '/owner' },
          { label: 'Riwayat Kas Keluar & Masuk' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Kas Keluar & Kas Masuk
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit seluruh pengambilan uang kasir oleh pemilik, belanja operasional, dan kas masuk.
          </p>
        </div>
      </div>

      {/* 2 Minimalist Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Kas Keluar (Ambil Uang)"
          value={`− ${formatRupiah(totalCashOut)}`}
          subtitle={`${movements.filter((m) => m.movement_type === 'cash_out').length} Kali Pengambilan`}
          icon={ArrowUpRight}
        />
        <StatCard
          title="Total Kas Masuk"
          value={`+ ${formatRupiah(totalCashIn)}`}
          subtitle={`${movements.filter((m) => m.movement_type === 'cash_in').length} Kali Kas Masuk`}
          icon={ArrowDownLeft}
        />
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Cari keperluan / kategori..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {/* Tipe Filter */}
        <select
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
          <option value="all">Semua Jenis Kas</option>
          <option value="cash_out">Kas Keluar (Ambil Uang)</option>
          <option value="cash_in">Kas Masuk</option>
        </select>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          />
          <span className="text-slate-400 text-xs">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Memuat riwayat kas...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Tidak Ada Catatan Kas</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Belum ada pergerakan kas masuk atau kas keluar sesuai filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Keperluan</th>
                  <th className="py-3 px-4">Diambil / Disetor Oleh</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {movements.map((m) => {
                  const isOut = m.movement_type === 'cash_out';
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {formatTanggalWaktu(m.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <CashMovementBadge type={m.movement_type} />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{m.category}</td>
                      <td className="py-3 px-4 font-medium text-slate-700">{m.person_name}</td>
                      <td
                        className={`py-3 px-4 text-right font-black font-mono text-sm whitespace-nowrap ${
                          isOut ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isOut ? '− ' : '+ '}
                        {formatRupiah(m.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {m.recorder?.full_name || 'Kasir'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] italic max-w-xs truncate">
                        {m.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerCashMovementsPage;
