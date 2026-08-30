import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { debtService } from '@/services/debtService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DebtStatusBadge } from '@/components/debts/DebtStatusBadge';
import { DebtPaymentModal } from '@/components/debts/DebtPaymentModal';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { useAuthStore } from '@/stores/authStore';
import {
  BookOpen,
  Users,
  Search,
  Plus,
  Coins,
  ArrowRight,
  TrendingDown,
  Phone,
  Clock,
  Eye,
  CreditCard,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { formatRupiah, formatTanggal } from '@/utils/formatters';

const STATUS_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Belum Lunas' },
  { id: 'partial', label: 'Dibayar Sebagian' },
  { id: 'paid', label: 'Lunas' },
];

const SORT_OPTIONS = [
  { id: 'debt_desc', label: 'Hutang Terbesar' },
  { id: 'debt_asc', label: 'Hutang Terkecil' },
  { id: 'newest', label: 'Terbaru' },
  { id: 'oldest', label: 'Terlama' },
  { id: 'name_asc', label: 'Nama (A-Z)' },
];

export default function DebtListPage() {
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const basePath = role === 'owner' ? '/owner/debts' : '/debts';

  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('debt_desc');

  // Modals
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState({
    isOpen: false,
    customer: null,
  });

  // 1. Query Ringkasan Global Hutang
  const { data: globalSummary = {}, isLoading: summaryLoading } = useQuery({
    queryKey: ['debt-global-summary'],
    queryFn: () => debtService.getDebtGlobalSummary(),
    refetchInterval: 15000,
  });

  // 2. Query Daftar Pelanggan dengan Hutang
  const { data: customers = [], isLoading: listLoading, refetch } = useQuery({
    queryKey: ['customers-with-debt', statusFilter, searchTerm, sortBy],
    queryFn: () =>
      debtService.getCustomersWithDebt({
        status: statusFilter,
        search: searchTerm,
        sortBy,
      }),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Hutang Pelanggan' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hutang Pelanggan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola pencatatan bon belanja pelanggan, saldo piutang, dan riwayat cicilan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddCustomerModalOpen(true)}
            className="bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-xs"
          >
            Tambah Pelanggan
          </Button>
        </div>
      </div>

      {/* 3 Minimalist Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Piutang Belum Lunas"
          value={summaryLoading ? '...' : formatRupiah(globalSummary.totalOutstandingDebt || 0)}
          subtitle="Sisa seluruh bon aktif"
          icon={Coins}
        />
        <StatCard
          title="Pelanggan Berhutang"
          value={summaryLoading ? '...' : `${(globalSummary.totalCustomersWithDebt || 0).toLocaleString('id-ID')} Orang`}
          subtitle="Memiliki sisa hutang"
          icon={Users}
        />
        <StatCard
          title="Pembayaran Hutang Hari Ini"
          value={summaryLoading ? '...' : formatRupiah(globalSummary.todayDebtPayments || 0)}
          subtitle="Uang masuk dari pelunasan"
          icon={Wallet}
        />
      </div>

      {/* Filter, Search & Sort Bar */}
      <Card bodyClassName="p-4 space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-amber-500"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama pelanggan atau nomor HP..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />
        </div>
      </Card>

      {/* List / Table Section */}
      <Card bodyClassName="p-0 overflow-hidden">
        {listLoading ? (
          <div className="py-16 text-center">
            <LoadingSpinner size="md" message="Memuat daftar hutang pelanggan..." />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={BookOpen}
              title="Tidak Ada Data Hutang"
              description={
                searchTerm
                  ? `Tidak ditemukan data pelanggan dengan kata kunci "${searchTerm}".`
                  : 'Belum ada catatan hutang pelanggan pada kategori ini.'
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4 text-right">Total Hutang</th>
                    <th className="py-3 px-4 text-right">Sudah Dibayar</th>
                    <th className="py-3 px-4 text-right">Sisa Hutang</th>
                    <th className="py-3 px-4">Pembayaran Terakhir</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-amber-50/30 transition-colors group cursor-pointer"
                      onClick={() => navigate(`${basePath}/${c.id}`)}
                    >
                      {/* Pelanggan */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                          {c.name}
                        </div>
                        {c.phone ? (
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone size={11} />
                            {c.phone}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Tanpa nomor HP</span>
                        )}
                      </td>

                      {/* Total Hutang */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-bold">
                        {formatRupiah(c.totalOriginalDebt)}
                      </td>

                      {/* Sudah Dibayar */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-bold">
                        {formatRupiah(c.totalPaid)}
                      </td>

                      {/* Sisa Hutang */}
                      <td className="py-3.5 px-4 text-right font-mono text-sm font-black text-rose-600">
                        {formatRupiah(c.remainingDebt)}
                      </td>

                      {/* Pembayaran Terakhir */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.lastPaymentDate ? (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {formatRupiah(c.lastPaymentAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTanggal(c.lastPaymentDate)} ({c.lastPaymentMethod})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Belum ada bayar</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <DebtStatusBadge status={c.debtStatus} remainingAmount={c.remainingDebt} />
                      </td>

                      {/* Aksi */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`${basePath}/${c.id}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Lihat Rincian Hutang"
                          >
                            <Eye size={14} />
                          </Link>

                          {c.remainingDebt > 0 && (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              icon={Coins}
                              onClick={() => setSelectedPayCustomer(c)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] py-1 px-2.5 font-bold shadow-xs"
                            >
                              Bayar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Responsive Cards */}
            <div className="md:hidden divide-y divide-slate-100 p-2">
              {customers.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 space-y-2.5 active:bg-slate-50 rounded-2xl transition-colors cursor-pointer"
                  onClick={() => navigate(`${basePath}/${c.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{c.name}</h4>
                      {c.phone && (
                        <p className="text-[11px] font-mono text-slate-400">{c.phone}</p>
                      )}
                    </div>
                    <DebtStatusBadge status={c.debtStatus} remainingAmount={c.remainingDebt} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Sisa Hutang
                      </span>
                      <span className="font-black text-rose-600 font-mono text-sm">
                        {formatRupiah(c.remainingDebt)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Total Hutang
                      </span>
                      <span className="font-bold text-slate-700 font-mono">
                        {formatRupiah(c.totalOriginalDebt)}
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      to={`${basePath}/${c.id}`}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <span>Lihat Rincian</span>
                      <ArrowRight size={12} />
                    </Link>

                    {c.remainingDebt > 0 && (
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={Coins}
                        onClick={() => setSelectedPayCustomer(c)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 font-bold"
                      >
                        Bayar Hutang
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Modal Bayar Hutang */}
      {selectedPayCustomer && (
        <DebtPaymentModal
          isOpen={Boolean(selectedPayCustomer)}
          onClose={() => setSelectedPayCustomer(null)}
          customer={selectedPayCustomer}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal Tambah Pelanggan Baru */}
      <CustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
