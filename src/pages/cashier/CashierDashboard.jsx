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
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      title: 'Transaksi',
      value: isLoading ? '...' : todaySummary.transactionCount || 0,
      subtitle: 'Jumlah nota / struk',
      icon: ShoppingCart,
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Barang Terjual',
      value: isLoading ? '...' : (todaySummary.totalItemsSold || 0).toLocaleString('id-ID'),
      subtitle: 'Total barang terlayani',
      icon: Package,
      iconBg: 'bg-violet-100 text-violet-600',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white backdrop-blur-sm">
              <UserCheck className="w-3.5 h-3.5" />
              Terminal Kasir
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat datang, {profile?.full_name || 'Kasir'}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Siap melayani pelanggan dengan cepat dan akurat.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/15 shrink-0 flex items-center gap-2.5 text-sm">
          <Calendar className="w-4 h-4 text-blue-200" />
          <span>{today}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.subtitle}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to="/pos"
          className="flex flex-col items-center gap-2 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/25"
        >
          <ShoppingCart size={24} />
          Buka Kasir / POS
        </Link>
        <Link
          to="/quick-calculator"
          className="flex flex-col items-center gap-2 py-5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm transition-colors"
        >
          <Calculator size={24} className="text-blue-600" />
          Kalkulator Cepat
        </Link>
        <Link
          to="/transactions"
          className="flex flex-col items-center gap-2 py-5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm transition-colors"
        >
          <History size={24} className="text-purple-600" />
          Riwayat Transaksi
        </Link>
        <Link
          to="/closing"
          className="flex flex-col items-center gap-2 py-5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold text-sm transition-colors"
        >
          <DollarSign size={24} className="text-green-600" />
          Tutup Kasir
        </Link>
      </div>
    </div>
  );
}

export default CashierDashboard;
