import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';
import { useAuthStore } from '@/stores/authStore';
import { History, Search, Eye, Printer, SlidersHorizontal, X } from 'lucide-react';

const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };
const METHOD_COLORS = {
  cash: 'bg-green-100 text-green-700',
  qris: 'bg-purple-100 text-purple-700',
  transfer: 'bg-blue-100 text-blue-700',
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

  const { data: transactions = [], isLoading, isError } = useQuery({
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <History size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Riwayat Transaksi</h1>
              <p className="text-xs text-gray-500">{transactions.length} transaksi ditemukan</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
              showFilters ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor transaksi..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dari Tanggal</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sampai Tanggal</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" />
              </div>
            </div>
            {(search || dateFrom || dateTo) && (
              <button onClick={resetFilters} className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <X size={12} /> Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Card */}
      {transactions.length > 0 && (
        <div className="px-4 sm:px-6 pt-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs">Total Pendapatan ({transactions.length} transaksi)</p>
              <p className="text-2xl font-black mt-0.5">Rp{totalRevenue.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto space-y-2">
          {isLoading && (
            <div className="text-center py-16 text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">Memuat transaksi...</p>
            </div>
          )}
          {isError && (
            <div className="text-center py-16 text-red-500 text-sm">Gagal memuat data transaksi.</div>
          )}
          {!isLoading && !isError && transactions.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <History size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Belum ada transaksi</p>
              <p className="text-xs mt-1">Transaksi yang telah diselesaikan akan muncul di sini</p>
            </div>
          )}
          {transactions.map((trx) => (
            <div key={trx.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{trx.transaction_number}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_COLORS[trx.payment_method] || 'bg-gray-100 text-gray-600'}`}>
                      {METHOD_LABELS[trx.payment_method] || trx.payment_method}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(trx.transaction_date)}</p>
                  {isOwner && trx.cashier && (
                    <p className="text-xs text-gray-400 mt-0.5">Kasir: {trx.cashier.full_name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-black text-blue-700">
                    Rp{Number(trx.total_amount).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-400">{Number(trx.total_quantity)} item</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <Link
                  to={`/transactions/${trx.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                  <Eye size={13} /> Detail
                </Link>
                <Link
                  to={`/transactions/${trx.id}/print`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-blue-200 text-blue-700 text-xs font-medium hover:bg-blue-50 transition-colors"
                >
                  <Printer size={13} /> Cetak Struk
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
