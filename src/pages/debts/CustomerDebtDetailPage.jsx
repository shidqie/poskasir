import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { debtService } from '@/services/debtService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { DebtStatusBadge } from '@/components/debts/DebtStatusBadge';
import { DebtPaymentModal } from '@/components/debts/DebtPaymentModal';
import { DebtPaymentReceipt } from '@/components/debts/DebtPaymentReceipt';
import { CustomerModal } from '@/components/customers/CustomerModal';
import { Modal } from '@/components/common/Modal';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  Phone,
  MapPin,
  FileText,
  Coins,
  Receipt,
  History,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  Edit,
  ArrowLeft,
  Banknote,
  QrCode,
  Package,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatTanggalWaktu } from '@/utils/formatters';

export default function CustomerDebtDetailPage() {
  const { customerId } = useParams();
  const { role } = useAuthStore();
  const navigate = useNavigate();
  const basePath = role === 'owner' ? '/owner/debts' : '/debts';

  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'payments'
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState(null);
  const [expandedTxId, setExpandedTxId] = useState(null);

  // 1. Query Ringkasan Hutang Pelanggan
  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['customer-debt-summary', customerId],
    queryFn: () => debtService.getCustomerDebtSummary(customerId),
    enabled: Boolean(customerId),
  });

  // 2. Query Transaksi Belanja Hutang
  const {
    data: debtTransactions = [],
    isLoading: txsLoading,
    refetch: refetchTxs,
  } = useQuery({
    queryKey: ['customer-debt-txs', customerId],
    queryFn: () => debtService.getCustomerDebtTransactions(customerId),
    enabled: Boolean(customerId),
  });

  // 3. Query Riwayat Pembayaran Hutang
  const {
    data: paymentHistory = [],
    isLoading: paymentsLoading,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['customer-payments', customerId],
    queryFn: () => debtService.getCustomerPaymentHistory(customerId),
    enabled: Boolean(customerId),
  });

  const customer = summaryData?.customer;
  const totalOriginalDebt = summaryData?.totalOriginalDebt || 0;
  const totalPaid = summaryData?.totalPaid || 0;
  const remainingDebt = summaryData?.remainingDebt || 0;
  const debtStatus = summaryData?.status || 'unpaid';

  const handleToggleExpandTx = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const refetchAll = () => {
    refetchSummary();
    refetchTxs();
    refetchPayments();
  };

  if (summaryLoading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Memuat detail hutang pelanggan..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <EmptyState
          icon={User}
          title="Pelanggan Tidak Ditemukan"
          description="Data pelanggan ini tidak tersedia dalam database."
        />
        <Button variant="outline" size="sm" onClick={() => navigate(basePath)}>
          Kembali ke Daftar Hutang
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Hutang Pelanggan', to: basePath },
          { label: customer.name },
        ]}
      />

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-700 border border-amber-500/25 flex items-center justify-center font-black text-xl shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {customer.name}
              </h1>
              <DebtStatusBadge status={debtStatus} remainingAmount={remainingDebt} />
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-0.5">
              {customer.phone ? (
                <span className="flex items-center gap-1.5 font-mono font-medium">
                  <Phone size={13} className="text-slate-400" />
                  {customer.phone}
                </span>
              ) : (
                <span className="italic text-slate-400">Tidak ada nomor HP</span>
              )}
              {customer.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  {customer.address}
                </span>
              )}
            </div>

            {customer.notes && (
              <p className="text-xs text-slate-400 italic pt-1">
                Catatan: {customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="md"
            icon={Edit}
            onClick={() => setIsEditCustomerModalOpen(true)}
            className="text-xs font-bold"
          >
            Edit Profil
          </Button>

          {remainingDebt > 0 && (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Coins}
              onClick={() => setIsPayModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25"
            >
              Bayar Hutang
            </Button>
          )}
        </div>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Hutang */}
        <Card bodyClassName="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Seluruh Bon / Hutang
            </span>
            <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatRupiah(totalOriginalDebt)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Dari {debtTransactions.length} nota transaksi
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Receipt size={20} />
          </div>
        </Card>

        {/* Card 2: Total Sudah Dibayar */}
        <Card bodyClassName="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Sudah Terbayar
            </span>
            <p className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
              {formatRupiah(totalPaid)}
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              Dari {paymentHistory.length} kali setoran
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </Card>

        {/* Card 3: Sisa Hutang Saat Ini */}
        <Card
          className="border-rose-200 bg-rose-50/30"
          bodyClassName="p-5 flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Sisa Hutang Saat Ini
            </span>
            <p className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              {formatRupiah(remainingDebt)}
            </p>
            <p className="text-[11px] text-rose-500 font-medium">
              {remainingDebt > 0 ? 'Wajib dilunasi' : 'Semua hutang telah lunas'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30">
            <Coins size={20} />
          </div>
        </Card>
      </div>

      {/* Tabs Riwayat Transaksi vs Pembayaran */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'transactions'
                ? 'border-amber-600 text-amber-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt size={15} />
            <span>Riwayat Belanja Hutang ({debtTransactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'payments'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <History size={15} />
            <span>Riwayat Pembayaran Setoran ({paymentHistory.length})</span>
          </button>
        </div>

        {/* Tab 1: Riwayat Transaksi Belanja */}
        {activeTab === 'transactions' && (
          <Card bodyClassName="p-0 overflow-hidden">
            {txsLoading ? (
              <div className="py-12 text-center">
                <LoadingSpinner size="md" message="Memuat riwayat transaksi belanja..." />
              </div>
            ) : debtTransactions.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Receipt}
                  title="Belum Ada Transaksi Hutang"
                  description="Pelanggan ini belum memiliki riwayat transaksi hutang belanja."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {debtTransactions.map((item) => {
                  const tx = item.transaction;
                  const isExpanded = expandedTxId === item.id;
                  const itemsList = tx?.transaction_items || [];

                  return (
                    <div key={item.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 font-mono">
                              {tx?.transaction_number || 'TRX-HUTANG'}
                            </span>
                            <DebtStatusBadge status={item.status} remainingAmount={item.remaining_amount} />
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                            <Calendar size={12} />
                            {formatTanggalWaktu(item.created_at)}
                            {tx?.cashier && (
                              <span>&bull; Kasir: {tx.cashier.full_name}</span>
                            )}
                          </p>
                        </div>

                        {/* Nominal Breakdown */}
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">
                              Total Belanja
                            </span>
                            <span className="font-bold text-slate-900">
                              {formatRupiah(item.original_amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">
                              Terbayar
                            </span>
                            <span className="font-bold text-emerald-600">
                              {formatRupiah(item.paid_amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans font-bold uppercase">
                              Sisa Hutang
                            </span>
                            <span className="font-black text-rose-600 text-sm">
                              {formatRupiah(item.remaining_amount)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleExpandTx(item.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title={isExpanded ? 'Tutup Rincian' : 'Lihat Barang'}
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Item Details List */}
                      {isExpanded && itemsList.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                            Daftar Barang yang Diambil:
                          </span>
                          <div className="divide-y divide-slate-200/60 text-xs">
                            {itemsList.map((prod, idx) => (
                              <div key={idx} className="py-1.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Package size={13} className="text-slate-400" />
                                  <span className="font-bold text-slate-800">
                                    {prod.item_name}
                                    {prod.variant_name ? ` (${prod.variant_name})` : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 font-mono">
                                  <span className="text-slate-500">
                                    {prod.quantity} {prod.unit_name} &times; {formatRupiah(prod.price)}
                                  </span>
                                  <span className="font-bold text-slate-900">
                                    {formatRupiah(prod.subtotal)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Tab 2: Riwayat Pembayaran Setoran */}
        {activeTab === 'payments' && (
          <Card bodyClassName="p-0 overflow-hidden">
            {paymentsLoading ? (
              <div className="py-12 text-center">
                <LoadingSpinner size="md" message="Memuat riwayat pembayaran..." />
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={History}
                  title="Belum Ada Pembayaran"
                  description="Pelanggan ini belum pernah melakukan setoran cicilan atau pelunasan."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paymentHistory.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-emerald-700 font-mono">
                          + {formatRupiah(p.amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 uppercase flex items-center gap-1">
                          {p.payment_method === 'cash' ? <Banknote size={12} className="text-emerald-600" /> : <QrCode size={12} className="text-red-600" />}
                          {p.payment_method === 'cash' ? 'Tunai' : 'QRIS'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {formatTanggalWaktu(p.payment_date)}
                        {p.receiver && (
                          <span>&bull; Diterima oleh: {p.receiver.full_name}</span>
                        )}
                      </p>
                      {p.notes && (
                        <p className="text-xs text-slate-400 italic">
                          Catatan: {p.notes}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Printer}
                      onClick={() =>
                        setSelectedReceiptPayment({
                          customer_name: customer.name,
                          amount_paid: p.amount,
                          payment_method: p.payment_method,
                          previous_debt: remainingDebt + Number(p.amount),
                          remaining_debt: remainingDebt,
                          is_fully_paid: remainingDebt <= 0,
                        })
                      }
                      className="text-xs font-bold"
                    >
                      Cetak Bukti
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Modal Bayar Hutang */}
      {isPayModalOpen && (
        <DebtPaymentModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          customer={{
            id: customer.id,
            name: customer.name,
            remainingDebt,
            phone: customer.phone,
          }}
          onSuccess={() => refetchAll()}
        />
      )}

      {/* Modal Edit Pelanggan */}
      {isEditCustomerModalOpen && (
        <CustomerModal
          isOpen={isEditCustomerModalOpen}
          onClose={() => setIsEditCustomerModalOpen(false)}
          customer={customer}
          onSuccess={() => refetchSummary()}
        />
      )}

      {/* Modal Cetak Bukti Pembayaran */}
      {selectedReceiptPayment && (
        <Modal
          isOpen={Boolean(selectedReceiptPayment)}
          onClose={() => setSelectedReceiptPayment(null)}
          title="Bukti Pembayaran Hutang"
          size="md"
        >
          <DebtPaymentReceipt
            paymentResult={selectedReceiptPayment}
            onClose={() => setSelectedReceiptPayment(null)}
          />
        </Modal>
      )}
    </div>
  );
}
