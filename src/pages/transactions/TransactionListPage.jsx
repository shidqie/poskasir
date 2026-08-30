import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';
import { useAuthStore } from '@/stores/authStore';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { History, Search, Eye, Printer, SlidersHorizontal, X } from 'lucide-react';

const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', debt: 'Hutang' };
const METHOD_COLORS = {
  cash: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  qris: 'bg-purple-50 text-purple-700 border border-purple-200',
  transfer: 'bg-red-50 text-red-700 border border-red-200',
  debt: 'bg-amber-100 text-amber-900 border border-amber-300 font-black',
};

function formatDate(dt) {
  return new Date(dt).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TransactionListPage() {
  const { role } = useAuthStore();
  const isOwner = role === 'owner';

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ['transactions', { search, dateFrom, dateTo }],
    queryFn: () => transactionService.getTransactions({ search, dateFrom, dateTo }),
    staleTime: 1000 * 30,
  });

  const totalRevenue = transactions.reduce((s, t) => s + Number(t.total_amount), 0);

  const resetFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-6xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Riwayat Transaksi' }]} />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-xs sm:text-sm text-slate-500">{transactions.length} transaksi selesai dicatat</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
            showFilters ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal size={14} />
          Filter
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor transaksi..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Dari Tanggal</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sampai Tanggal</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium" />
            </div>
          </div>
          {(search || dateFrom || dateTo) && (
            <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-rose-600 font-bold hover:underline cursor-pointer">
              <X size={12} /> Reset Filter
            </button>
          )}
        </div>
      )}

      {/* Summary Banner */}
      {transactions.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-2xl p-5 text-white shadow-lg shadow-red-600/15 flex items-center justify-between border border-red-500/30">
          <div>
            <p className="text-red-100 text-xs font-medium">Total Akumulasi ({transactions.length} transaksi)</p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5">Rp{totalRevenue.toLocaleString('id-ID')}</p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2.5">
        {isLoading && (
          <div className="text-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Memuat transaksi...</p>
          </div>
        )}
        {isError && (
          <Alert variant="danger" title="Gagal Memuat Data Transaksi">
            {error?.message || 'Silakan coba beberapa saat lagi.'}
          </Alert>
        )}
        {!isLoading && !isError && transactions.length === 0 && (
          <EmptyState
            icon={History}
            title={search || dateFrom || dateTo ? 'Transaksi Tidak Ditemukan' : 'Belum Ada Transaksi'}
            description={
              search || dateFrom || dateTo
                ? 'Coba sesuaikan kata kunci pencarian atau rentang tanggal.'
                : 'Transaksi penjualan yang telah selesai diproses di kasir akan muncul di sini.'
            }
          />
        )}
        {transactions.map((trx) => (
          <div key={trx.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:border-red-200 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {trx.transaction_number}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${METHOD_COLORS[trx.payment_method] || 'bg-slate-100 text-slate-600'}`}>
                    {METHOD_LABELS[trx.payment_method] || trx.payment_method}
                  </span>
                  {trx.customer?.name && (
                    <span className="text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      Pelanggan: {trx.customer.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {formatDate(trx.transaction_date || trx.created_at)} • Kasir: <span className="font-semibold text-slate-700">{trx.cashier?.full_name || 'Kasir'}</span>
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-left sm:text-right">
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    Rp{Number(trx.total_amount).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-400">{Number(trx.total_quantity)} item</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/transactions/${trx.id}/print`}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                    title="Cetak Struk"
                  >
                    <Printer size={16} />
                  </Link>
                  <Link
                    to={`/transactions/${trx.id}`}
                    className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
