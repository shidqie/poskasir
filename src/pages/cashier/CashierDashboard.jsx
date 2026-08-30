import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { transactionService } from '@/services/transactionService';
import { Card } from '@/components/common/Card';
import { DollarSign, ShoppingCart, Package, UserCheck, Calendar, History, Calculator } from 'lucide-react';
import { formatTanggal } from '@/utils/formatters';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

export function CashierDashboard() {
  const { profile, user } = useAuthStore();
  const today = formatTanggal(new Date());

  const { data: todaySummary = {}, isLoading } = useQuery({
    queryKey: ['today-summary', user?.id],
    queryFn: () => transactionService.getTodaySummary(user?.id),
    refetchInterval: 1000 * 60,
    enabled: !!user?.id,
  });

  const summaryCards = [
    {
      title: 'Penjualan Saya Hari Ini',
      value: isLoading ? '...' : formatRupiah(todaySummary.totalRevenue),
      subtitle: 'Total transaksi berhasil',
      icon: DollarSign,
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
    },
    {
      title: 'Transaksi',
      value: isLoading ? '...' : todaySummary.transactionCount || 0,
      subtitle: 'Jumlah nota / struk',
      icon: ShoppingCart,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    {
      title: 'Barang Terjual',
      value: isLoading ? '...' : (todaySummary.totalItemsSold || 0).toLocaleString('id-ID'),
      subtitle: 'Total barang terlayani',
      icon: Package,
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-100',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-2xl p-6 text-white shadow-xl shadow-red-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
              <UserCheck className="w-3.5 h-3.5" />
              Terminal Kasir
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat datang, {profile?.full_name || 'Kasir'}
          </h1>
          <p className="text-red-100 text-sm mt-1">
            Siap melayani pelanggan dengan cepat, akurat, dan mudah.
          </p>
        </div>
        <div className="bg-black/20 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 shrink-0 flex items-center gap-2.5 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-red-200" />
          <span>{today}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all hover:border-red-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <Link
          to="/pos"
          className="flex flex-col items-center gap-2.5 py-6 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-600/25 active:scale-95"
        >
          <div className="p-2.5 bg-white/20 rounded-xl">
            <ShoppingCart size={22} />
          </div>
          <span>Buka Kasir / POS</span>
        </Link>
        <Link
          to="/quick-calculator"
          className="flex flex-col items-center gap-2.5 py-6 px-4 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-slate-800 rounded-2xl font-bold text-sm transition-all shadow-xs active:scale-95"
        >
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <Calculator size={22} />
          </div>
          <span>Kalkulator Cepat</span>
        </Link>
        <Link
          to="/transactions"
          className="flex flex-col items-center gap-2.5 py-6 px-4 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-slate-800 rounded-2xl font-bold text-sm transition-all shadow-xs active:scale-95"
        >
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <History size={22} />
          </div>
          <span>Riwayat Struk</span>
        </Link>
        <Link
          to="/closing"
          className="flex flex-col items-center gap-2.5 py-6 px-4 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50/40 text-slate-800 rounded-2xl font-bold text-sm transition-all shadow-xs active:scale-95"
        >
          <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
            <DollarSign size={22} />
          </div>
          <span>Tutup Kasir</span>
        </Link>
      </div>
    </div>
  );
}

export default CashierDashboard;
