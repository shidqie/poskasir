import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Tabs } from '@/components/common/Tabs';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Avatar } from '@/components/common/Avatar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Trophy, Users, TrendingUp, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Hari Ini' },
  { id: '7days', label: '7 Hari Terakhir' },
  { id: 'month', label: 'Bulan Ini' },
  { id: 'custom', label: 'Rentang Kustom' },
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
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = period === 'custom'
    ? { dateFrom: customFrom, dateTo: customTo }
    : getDateRange(period);

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
    { label: 'Total Pendapatan', value: summaryLoading ? '...' : formatRupiah(summary.totalRevenue), Icon: DollarSign, color: 'text-red-600 bg-red-50 border border-red-100' },
    { label: 'Jumlah Transaksi', value: summaryLoading ? '...' : (summary.transactionCount || 0).toLocaleString('id-ID'), Icon: ShoppingCart, color: 'text-rose-600 bg-rose-50 border border-rose-100' },
    { label: 'Item Terjual', value: summaryLoading ? '...' : (summary.totalItemsSold || 0).toLocaleString('id-ID'), Icon: Package, color: 'text-orange-600 bg-orange-50 border border-orange-100' },
    { label: 'Rata-Rata Transaksi', value: summaryLoading ? '...' : formatRupiah(summary.avgTransaction), Icon: TrendingUp, color: 'text-amber-600 bg-amber-50 border border-amber-100' },
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
          <p className="text-xs sm:text-sm text-slate-500">Analisis performa omzet dan tren produk sembako</p>
        </div>
      </div>

      {/* Period Selector Card */}
      <Card bodyClassName="p-4 space-y-3">
        <Tabs
          tabs={PERIOD_OPTIONS}
          activeTab={period}
          onChange={setPeriod}
        />
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, Icon, color }) => (
          <Card
            key={label}
            className="hover:border-red-300 transition-all hover:shadow-md"
            bodyClassName="p-5 flex flex-col justify-between h-full"
          >
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Chart Card */}
      <Card
        title="Tren Penjualan 14 Hari Terakhir"
        subtitle="Grafik fluktuasi omzet transaksi sembako"
      >
        {chartLoading ? (
          <div className="h-52 flex items-center justify-center">
            <LoadingSpinner size="md" message="Memuat grafik tren..." />
          </div>
        ) : dailySales.length === 0 || dailySales.every((d) => d.total === 0) ? (
          <div className="py-8">
            <EmptyState
              icon={BarChart3}
              title="Belum Ada Data Penjualan"
              description="Grafik tren akan terisi otomatis seiring transaksi yang diselesaikan kasir."
            />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailySales} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']}
                labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #fee2e2' }}
              />
              <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Top 10 Products & Cashier Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top 10 Products */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-amber-500" />
              <span className="font-bold text-slate-900 text-sm">10 Barang Paling Laris</span>
            </div>
          }
        >
          {topLoading ? (
            <div className="py-8 text-center">
              <LoadingSpinner size="sm" message="Memuat ranking produk..." />
            </div>
          ) : topProducts.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Trophy}
                title="Belum Ada Data"
                description="Belum ada transaksi barang pada rentang tanggal ini."
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-red-600 text-white' : i === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                  }`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{Number(p.totalQty).toLocaleString('id-ID')} terjual</p>
                  </div>
                  <p className="font-black text-red-600 shrink-0 font-mono">{formatRupiah(p.totalRevenue)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sales by Cashier */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users size={18} className="text-red-600" />
              <span className="font-bold text-slate-900 text-sm">Performa Kasir</span>
            </div>
          }
          bodyClassName="p-0 overflow-hidden"
        >
          {cashierLoading ? (
            <div className="py-8 text-center">
              <LoadingSpinner size="sm" message="Memuat performa kasir..." />
            </div>
          ) : cashierPerformance.length === 0 ? (
            <div className="py-6">
              <EmptyState
                icon={Users}
                title="Belum Ada Data"
                description="Belum ada aktivitas kasir pada rentang tanggal ini."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Kasir</th>
                    <th className="px-4 py-3.5 text-center">Nota</th>
                    <th className="px-5 py-3.5 text-right">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cashierPerformance.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-2.5">
                        <Avatar name={c.name} size="sm" />
                        <span className="font-bold text-slate-800">{c.name}</span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant="neutral">{c.count} nota</Badge>
                      </td>
                      <td className="px-5 py-4 text-right font-black text-red-600 font-mono">
                        {formatRupiah(c.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
