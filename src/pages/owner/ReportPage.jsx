import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Trophy, Users, TrendingUp, DollarSign, ShoppingCart, Package, Calendar } from 'lucide-react';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

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
    queryFn: () => reportService.getSummary(range),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ['report-top-products', range],
    queryFn: () => reportService.getTopProducts({ ...range, limit: 5 }),
  });

  const { data: cashierPerformance = [] } = useQuery({
    queryKey: ['report-cashiers', range],
    queryFn: () => reportService.getCashierPerformance(range),
  });

  const { data: dailySales = [] } = useQuery({
    queryKey: ['report-daily-sales'],
    queryFn: () => reportService.getDailySales({ days: 14 }),
  });

  const metrics = [
    { label: 'Total Pendapatan', value: summaryLoading ? '...' : formatRupiah(summary.totalRevenue), Icon: DollarSign, color: 'text-red-600 bg-red-50 border border-red-100' },
    { label: 'Jumlah Transaksi', value: summaryLoading ? '...' : summary.transactionCount || 0, Icon: ShoppingCart, color: 'text-rose-600 bg-rose-50 border border-rose-100' },
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

      {/* Period Selector Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <Tabs
          tabs={PERIOD_OPTIONS}
          activeTab={period}
          onChange={setPeriod}
        />
        {period === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-red-200 transition-colors">
            <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={18} />
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-semibold text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-4">Tren Penjualan 14 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailySales} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']}
              labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
              contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #fee2e2' }}
            />
            <Bar dataKey="total" fill="#DC2626" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 Products & Cashier Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Products */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="font-bold text-slate-900 text-sm">10 Barang Paling Laris</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Belum ada data</div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-red-600 text-white' : i === 1 ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-600'
                  }`}>{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{Number(p.totalQty).toLocaleString('id-ID')} terjual</p>
                  </div>
                  <p className="font-black text-red-600 shrink-0">{formatRupiah(p.totalRevenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sales by Cashier */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-red-600" />
            <h3 className="font-bold text-slate-900 text-sm">Performa Kasir</h3>
          </div>
          {byCashier.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">Belum ada data</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
                    <th className="pb-3">Kasir</th>
                    <th className="pb-3 text-right">Nota</th>
                    <th className="pb-3 text-right">Total Penjualan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {byCashier.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-slate-800">{c.name}</td>
                      <td className="py-3 text-right text-slate-600">{c.count}</td>
                      <td className="py-3 text-right font-black text-red-600">{formatRupiah(c.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
