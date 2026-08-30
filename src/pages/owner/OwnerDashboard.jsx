import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { transactionService } from '@/services/transactionService';
import { reportService } from '@/services/reportService';
import { Card } from '@/components/common/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, TrendingUp, ShieldCheck,
  Calendar, ArrowRight, Trophy, Users, BarChart3,
} from 'lucide-react';
import { formatTanggal } from '@/utils/formatters';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

export function OwnerDashboard() {
  const { profile } = useAuthStore();
  const today = formatTanggal(new Date());

  const { data: todaySummary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['today-summary'],
    queryFn: () => transactionService.getTodaySummary(),
    refetchInterval: 1000 * 60,
  });

  const { data: dailySales = [], isLoading: chartLoading } = useQuery({
    queryKey: ['daily-sales'],
    queryFn: () => reportService.getDailySales(7),
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportService.getTopProducts(5),
    refetchInterval: 1000 * 60 * 10,
  });

  const { data: salesByCashier = [] } = useQuery({
    queryKey: ['sales-by-cashier'],
    queryFn: () => reportService.getSalesByCashier(),
    refetchInterval: 1000 * 60 * 10,
  });

  const summaryCards = [
    {
      title: 'Pendapatan Hari Ini',
      value: summaryLoading ? '...' : formatRupiah(todaySummary.totalRevenue),
      subtitle: 'Total transaksi berhasil',
      icon: DollarSign,
      iconBg: 'bg-red-50 text-red-600 border border-red-100',
    },
    {
      title: 'Transaksi Hari Ini',
      value: summaryLoading ? '...' : todaySummary.transactionCount || 0,
      subtitle: 'Jumlah nota / struk',
      icon: ShoppingCart,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    {
      title: 'Barang Terjual',
      value: summaryLoading ? '...' : (todaySummary.totalItemsSold || 0).toLocaleString('id-ID'),
      subtitle: 'Total kuantitas barang',
      icon: Package,
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-100',
    },
    {
      title: 'Rata-Rata Transaksi',
      value: summaryLoading ? '...' : formatRupiah(todaySummary.avgTransaction),
      subtitle: 'Nilai belanja per pelanggan',
      icon: TrendingUp,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Minimalist Red Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-2xl p-6 text-white shadow-xl shadow-red-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Panel Manajemen Pemilik
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat datang, {profile?.full_name || 'Pemilik Toko'}
          </h1>
          <p className="text-red-100 text-sm mt-1 font-medium">
            Pantau ringkasan operasional dan performa kasir sembako Anda secara real-time.
          </p>
        </div>
        <div className="bg-black/20 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/20 shrink-0 flex items-center gap-2.5 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-red-200" />
          <span>{today}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all hover:border-red-200 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2">{card.value}</p>
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

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar Chart Penjualan 7 Hari */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Penjualan 7 Hari Terakhir</h3>
            </div>
            <Link to="/owner/reports" className="text-xs font-semibold text-red-600 flex items-center gap-1 hover:text-red-700 hover:underline">
              Laporan Lengkap <ArrowRight size={12} />
            </Link>
          </div>
          {chartLoading ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">Memuat grafik...</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailySales} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']}
                  labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                  contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #fee2e2', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Barang Terlaris */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Barang Terlaris</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">Belum ada data penjualan</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-red-600 text-white shadow-xs shadow-red-500/30' : i === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                  }`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{Number(p.totalQty).toLocaleString('id-ID')} terjual</p>
                  </div>
                  <p className="text-xs font-black text-red-600 shrink-0">{formatRupiah(p.totalRevenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Penjualan Per Kasir */}
      {salesByCashier.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Penjualan Per Kasir</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                  <th className="pb-3 font-bold">Kasir</th>
                  <th className="pb-3 font-bold text-right">Transaksi Selesai</th>
                  <th className="pb-3 font-bold text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesByCashier.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-bold text-slate-800">{c.name}</td>
                    <td className="py-3 text-right text-slate-600">{c.count} struk</td>
                    <td className="py-3 text-right font-black text-red-600">{formatRupiah(c.totalRevenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboard;
