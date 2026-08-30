import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Trophy, Users, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';

const formatRupiah = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;

const PERIOD_OPTIONS = [
  { label: 'Hari Ini', value: 'today' },
  { label: '7 Hari', value: '7days' },
  { label: 'Bulan Ini', value: 'month' },
  { label: 'Kustom', value: 'custom' },
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
    enabled: period !== 'custom' || !!(customFrom && customTo),
  });

  const { data: dailySales = [] } = useQuery({
    queryKey: ['daily-sales', 14],
    queryFn: () => reportService.getDailySales(14),
  });

  const { data: topProducts = [] } = useQuery({
    queryKey: ['top-products', 10],
    queryFn: () => reportService.getTopProducts(10),
  });

  const { data: byCashier = [] } = useQuery({
    queryKey: ['sales-by-cashier'],
    queryFn: () => reportService.getSalesByCashier(),
  });

  const metrics = [
    { label: 'Total Pendapatan', value: summaryLoading ? '...' : formatRupiah(summary.totalRevenue), Icon: DollarSign, color: 'text-green-600 bg-green-100' },
    { label: 'Jumlah Transaksi', value: summaryLoading ? '...' : summary.transactionCount || 0, Icon: ShoppingCart, color: 'text-blue-600 bg-blue-100' },
    { label: 'Item Terjual', value: summaryLoading ? '...' : (summary.totalItemsSold || 0).toLocaleString('id-ID'), Icon: Package, color: 'text-violet-600 bg-violet-100' },
    { label: 'Rata-Rata Transaksi', value: summaryLoading ? '...' : formatRupiah(summary.avgTransaction), Icon: TrendingUp, color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">Laporan Penjualan</h1>
            <p className="text-xs text-gray-500">Analisis performa penjualan toko</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Period Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dari</label>
                <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sampai</label>
                <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
          )}
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className={`w-8 h-8 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={16} />
              </div>
              <p className="text-xl font-black text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold text-gray-900 text-sm mb-4">Tren Penjualan 14 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailySales} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Pendapatan']}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom: Top Products + By Cashier */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Barang Terlaris */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={15} className="text-amber-500" />
              <h3 className="font-bold text-gray-900 text-sm">10 Barang Terlaris</h3>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-6">Belum ada data</p>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{Number(p.totalQty).toLocaleString('id-ID')} terjual</p>
                    </div>
                    <p className="text-xs font-bold text-blue-700 shrink-0">{formatRupiah(p.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Penjualan Per Kasir */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={15} className="text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Penjualan Per Kasir</h3>
            </div>
            {byCashier.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-6">Belum ada data</p>
            ) : (
              <div className="space-y-2.5">
                {byCashier.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.count} transaksi</p>
                    </div>
                    <p className="text-xs font-bold text-blue-700 shrink-0">{formatRupiah(c.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
