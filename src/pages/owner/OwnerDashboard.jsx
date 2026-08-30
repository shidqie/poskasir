import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { transactionService } from '@/services/transactionService';
import { reportService } from '@/services/reportService';
import { productService } from '@/services/productService';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/common/Alert';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, ShoppingCart, Package, TrendingUp, ShieldCheck,
  Calendar, ArrowRight, Trophy, Users, BarChart3, AlertTriangle, Boxes
} from 'lucide-react';
import { formatTanggal, formatRupiah } from '@/utils/formatters';

export function OwnerDashboard() {
  const { profile } = useAuthStore();
  const today = formatTanggal(new Date(), 'DD MMMM YYYY');

  // Ringkasan Hari Ini
  const { data: todaySummary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['today-summary'],
    queryFn: () => transactionService.getTodaySummary(),
    refetchInterval: 1000 * 60,
  });

  // Penjualan 7 Hari
  const { data: dailySales = [], isLoading: chartLoading } = useQuery({
    queryKey: ['daily-sales'],
    queryFn: () => reportService.getDailySales(7),
    refetchInterval: 1000 * 60 * 5,
  });

  // Barang Terlaris (Top Products & Variants)
  const { data: topProducts = [], isLoading: topLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => reportService.getTopProducts(5),
    refetchInterval: 1000 * 60 * 10,
  });

  // Penjualan Per Kasir
  const { data: salesByCashier = [], isLoading: cashierSalesLoading } = useQuery({
    queryKey: ['sales-by-cashier'],
    queryFn: () => reportService.getSalesByCashier(),
    refetchInterval: 1000 * 60 * 10,
  });

  // Data Barang Menipis (Low Stock Alert)
  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ['products-low-stock'],
    queryFn: () => productService.getProducts({ stockFilter: 'low' }),
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
      value: summaryLoading ? '...' : (todaySummary.transactionCount || 0).toLocaleString('id-ID'),
      subtitle: 'Jumlah nota / struk kasir',
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

      {/* Low Stock Alert Component */}
      {lowStockProducts.length > 0 && (
        <Alert
          variant="warning"
          title={`Perhatian: ${lowStockProducts.length} Produk Menipis!`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
            <span>
              Ada beberapa stok barang atau varian yang mendekati batas minimum persediaan.
            </span>
            <Link
              to="/owner/stock/adjustments"
              className="font-bold underline text-amber-900 hover:text-amber-950 shrink-0"
            >
              Lakukan Penyesuaian Stok →
            </Link>
          </div>
        </Alert>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="hover:border-red-300 transition-all hover:shadow-md"
              bodyClassName="p-4 sm:p-5 flex flex-col justify-between h-full"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight truncate">
                    {card.title}
                  </p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono truncate">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 font-medium line-clamp-1">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Chart + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Bar Chart Penjualan 7 Hari */}
        <Card
          className="lg:col-span-3"
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <BarChart3 size={18} />
              </div>
              <span className="font-bold text-slate-900 text-sm">
                Penjualan 7 Hari Terakhir
              </span>
            </div>
          }
          action={
            <Link
              to="/owner/reports"
              className="text-xs font-bold text-red-600 flex items-center gap-1 hover:text-red-700 hover:underline"
            >
              Laporan Lengkap <ArrowRight size={12} />
            </Link>
          }
        >
          {chartLoading ? (
            <div className="h-52 flex items-center justify-center">
              <LoadingSpinner size="md" message="Memuat grafik penjualan..." />
            </div>
          ) : dailySales.length === 0 || dailySales.every((d) => d.total === 0) ? (
            <div className="py-8">
              <EmptyState
                icon={BarChart3}
                title="Belum Ada Transaksi 7 Hari Terakhir"
                description="Grafik omzet penjualan harian akan muncul otomatis begitu kasir memproses transaksi."
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailySales} margin={{ top: 12, right: 12, left: -15, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Omzet']}
                  labelStyle={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 12,
                    border: '1px solid #fee2e2',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Barang Terlaris */}
        <Card
          className="lg:col-span-2"
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy size={18} />
              </div>
              <span className="font-bold text-slate-900 text-sm">Barang Terlaris</span>
            </div>
          }
        >
          {topLoading ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="sm" message="Memuat ranking produk..." />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Trophy}
                title="Belum Ada Data Penjualan"
                description="Produk paling laris akan diranking di sini setelah transaksi kasir tercatat."
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      i === 0
                        ? 'bg-red-600 text-white shadow-xs shadow-red-500/30'
                        : i === 1
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {Number(p.totalQty).toLocaleString('id-ID')} terjual
                    </p>
                  </div>
                  <p className="text-xs font-black text-red-600 shrink-0 font-mono">
                    {formatRupiah(p.totalRevenue)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Penjualan Per Kasir */}
      {salesByCashier.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <Users size={18} />
              </div>
              <span className="font-bold text-slate-900 text-sm">Penjualan Per Kasir</span>
            </div>
          }
          bodyClassName="p-0 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Kasir</th>
                  <th className="px-6 py-3.5 font-bold text-center">Transaksi Selesai</th>
                  <th className="px-6 py-3.5 font-bold text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salesByCashier.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-2.5">
                      <Avatar name={c.name} size="sm" />
                      <span className="font-bold text-slate-800">{c.name}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="neutral">
                        {c.count} nota
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600 font-mono text-sm">
                      {formatRupiah(c.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default OwnerDashboard;
