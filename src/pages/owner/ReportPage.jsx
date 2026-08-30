import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Avatar } from '@/components/common/Avatar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Trophy,
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  Banknote,
  QrCode,
  Layers,
  Wallet,
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari Terakhir' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'custom', label: 'Rentang Kustom' },
];

const PAYMENT_FILTER_OPTIONS = [
  { id: 'all', label: 'Semua Pembayaran', icon: Layers },
  { id: 'cash', label: 'Tunai', icon: Banknote },
  { id: 'qris', label: 'QRIS', icon: QrCode },
];

function getDateRange(period) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(startOfDay.getTime() + 86400000);

  if (period === 'today') {
    return { dateFrom: startOfDay.toISOString(), dateTo: tomorrow.toISOString() };
  }
  if (period === '7days') {
    const from = new Date(startOfDay.getTime() - 6 * 86400000);
    return { dateFrom: from.toISOString(), dateTo: tomorrow.toISOString() };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dateFrom: from.toISOString(), dateTo: tomorrow.toISOString() };
  }
  return { dateFrom: '', dateTo: '' };
}

export default function ReportPage() {
  const [period, setPeriod] = useState('7days');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range =
    period === 'custom'
      ? { dateFrom: customFrom, dateTo: customTo, paymentMethod }
      : { ...getDateRange(period), paymentMethod };

  const { data: summary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['report-summary', range],
    queryFn: () => reportService.getSalesSummary(range),
  });

  const { data: topProducts = [], isLoading: topLoading } = useQuery({
    queryKey: ['report-top-products', range],
    queryFn: () => reportService.getTopProducts(10),
  });

  const { data: cashierPerformance = [], isLoading: cashierLoading } = useQuery({
    queryKey: ['report-cashiers', range],
    queryFn: () => reportService.getSalesByCashier(),
  });

  const { data: dailySales = [], isLoading: chartLoading } = useQuery({
    queryKey: ['report-daily-sales'],
    queryFn: () => reportService.getDailySales(14),
  });

  const metrics = [
    {
      label: 'Total Keseluruhan',
      value: summaryLoading ? '...' : formatRupiah(summary.totalRevenue),
      sub: `${(summary.transactionCount || 0).toLocaleString('id-ID')} Total Nota`,
      Icon: Wallet,
      color: 'text-red-600 bg-red-50 border border-red-200',
    },
    {
      label: 'Total Tunai',
      value: summaryLoading ? '...' : formatRupiah(summary.cashRevenue || 0),
      sub: `${(summary.cashTxCount || 0).toLocaleString('id-ID')} Transaksi Tunai`,
      Icon: Banknote,
      color: 'text-emerald-600 bg-emerald-50 border border-emerald-200',
    },
    {
      label: 'Total QRIS (Digital)',
      value: summaryLoading ? '...' : formatRupiah(summary.qrisRevenue || 0),
      sub: `${(summary.qrisTxCount || 0).toLocaleString('id-ID')} Transaksi QRIS`,
      Icon: QrCode,
      color: 'text-red-600 bg-red-50 border border-red-200',
    },
    {
      label: 'Rata-Rata Transaksi',
      value: summaryLoading ? '...' : formatRupiah(summary.avgTransaction),
      sub: 'Basket Size',
      Icon: TrendingUp,
      color: 'text-purple-600 bg-purple-50 border border-purple-200',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Laporan Penjualan' }]} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Laporan Penjualan</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Analisis performa omzet toko, rekapitulasi Tunai vs QRIS, dan tren produk terlaris
          </p>
        </div>
      </div>

      {/* Filters: Periode & Metode Pembayaran */}
      <Card bodyClassName="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Periode Tabs */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Pilih Rentang Periode:
            </span>
            <Tabs tabs={PERIOD_OPTIONS} activeTab={period} onChange={setPeriod} />
          </div>

          {/* Payment Method Filter */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Filter Metode Pembayaran:
            </span>
            <div className="bg-slate-200/80 p-1 rounded-xl flex gap-1 text-xs font-bold">
              {PAYMENT_FILTER_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`py-2 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-red-600 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-red-500 font-medium"
              />
            </div>
          </div>
        )}
      </Card>

      {/* 4 Metric Cards Matching Exact Prompt Requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, sub, Icon, color }) => (
          <Card
            key={label}
            className="hover:border-red-300 transition-all hover:shadow-md"
            bodyClassName="p-5 flex flex-col justify-between h-full space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                <Icon size={18} />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{sub}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Grafik Tren Penjualan Tunai vs QRIS (14 Hari) */}
      <Card
        title="Tren Penjualan Harian: Tunai vs QRIS (14 Hari Terakhir)"
        subtitle="Analisis perbandingan nominal transaksi tunai dan QRIS"
      >
        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <LoadingSpinner size="md" message="Memuat grafik tren..." />
          </div>
        ) : dailySales.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <EmptyState icon={BarChart3} title="Belum Ada Data Penjualan" description="Grafik akan muncul setelah ada transaksi." />
          </div>
        ) : (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySales} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val, name) => [formatRupiah(val), name === 'cash' ? 'Tunai' : name === 'qris' ? 'QRIS' : 'Total']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend formatter={(val) => (val === 'cash' ? 'Tunai' : val === 'qris' ? 'QRIS' : 'Total')} />
                <Bar dataKey="cash" name="cash" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="qris" name="qris" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Grid: Top Produk & Performa Kasir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 Produk */}
        <Card
          title="10 Produk & Varian Terlaris"
          subtitle="Berdasarkan kuantitas barang terjual"
        >
          {topLoading ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="sm" message="Memuat produk terlaris..." />
            </div>
          ) : topProducts.length === 0 ? (
            <EmptyState icon={Package} title="Belum Ada Data Produk" description="Data produk terlaris akan tampil di sini." />
          ) : (
            <div className="divide-y divide-slate-100">
              {topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-slate-800">{p.totalQty} terjual</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{formatRupiah(p.totalRevenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Performa Kasir */}
        <Card
          title="Performa Penjualan per Kasir"
          subtitle="Kontribusi omzet dari masing-masing kasir"
        >
          {cashierLoading ? (
            <div className="py-12 text-center">
              <LoadingSpinner size="sm" message="Memuat data kasir..." />
            </div>
          ) : cashierPerformance.length === 0 ? (
            <EmptyState icon={Users} title="Belum Ada Data Kasir" description="Data penjualan kasir akan tampil di sini." />
          ) : (
            <div className="divide-y divide-slate-100">
              {cashierPerformance.map((c, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} size="sm" />
                    <div>
                      <p className="font-bold text-slate-900">{c.name}</p>
                      <span className="text-[10px] text-slate-400">{c.transactionCount} transaksi</span>
                    </div>
                  </div>
                  <span className="font-black text-red-600 font-mono text-sm">{formatRupiah(c.totalRevenue)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
