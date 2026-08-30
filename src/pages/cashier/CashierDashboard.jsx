import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cashierSessionService } from '@/services/cashierSessionService';
import { cashMovementService } from '@/services/cashMovementService';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { CashierSessionStatusBadge } from '@/components/cashier/CashierSessionStatusBadge';
import { OpenCashierModal } from '@/components/cashier/OpenCashierModal';
import { CashMovementModal } from '@/components/cashier/CashMovementModal';
import { CashMovementHistoryTable } from '@/components/cashier/CashMovementHistoryTable';
import { Toast } from '@/components/common/Toast';
import {
  TrendingUp,
  Receipt,
  ShoppingBag,
  UserCheck,
  Calendar,
  History,
  Calculator,
  ShoppingCart,
  DollarSign,
  Coins,
  QrCode,
  Banknote,
  Wallet,
  DoorOpen,
  DoorClosed,
  ArrowRight,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatTanggal, formatRupiah, formatTanggalWaktu } from '@/utils/formatters';

export function CashierDashboard() {
  const { profile, user } = useAuthStore();
  const today = formatTanggal(new Date(), 'DD MMMM YYYY');
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [cashMovementModalState, setCashMovementModalState] = useState({
    isOpen: false,
    type: 'cash_out',
  });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // 1. Query Sesi Kasir Aktif
  const {
    data: activeSession,
    isLoading: sessionLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ['active-cashier-session', user?.id],
    queryFn: () => cashierSessionService.getActiveSession(user?.id),
    refetchInterval: 10000,
    enabled: !!user?.id,
  });

  // 2. Query Riwayat Pergerakan Kas Sesi Aktif
  const { data: movements = [], refetch: refetchMovements } = useQuery({
    queryKey: ['session-cash-movements', activeSession?.id],
    queryFn: () => cashMovementService.getSessionCashMovements(activeSession?.id),
    enabled: Boolean(activeSession?.id),
    refetchInterval: 10000,
  });

  const isSessionOpen = activeSession && activeSession.status === 'open';
  const openingCash = Number(activeSession?.opening_cash || 0);
  const cashSales = Number(activeSession?.cash_sales || 0);
  const qrisSales = Number(activeSession?.qris_sales || 0);
  const debtSales = Number(activeSession?.debt_sales || 0);
  const totalSales = Number(activeSession?.total_sales || 0);
  const cashDebtPayments = Number(activeSession?.cash_debt_payments || 0);
  const qrisDebtPayments = Number(activeSession?.qris_debt_payments || 0);
  const cashIn = Number(activeSession?.cash_in || 0);
  const cashOut = Number(activeSession?.cash_out || 0);

  // Saldo Tunai Seharusnya = Saldo Awal + Penjualan Tunai + Pembayaran Hutang Tunai + Kas Masuk - Kas Keluar
  const expectedCash = openingCash + cashSales + cashDebtPayments + cashIn - cashOut;

  const handleOpenMovementModal = (type) => {
    setCashMovementModalState({
      isOpen: true,
      type,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-3xl p-6 text-white shadow-xl shadow-red-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-xs">
              <UserCheck className="w-3.5 h-3.5" />
              Terminal Kasir
            </span>
            {isSessionOpen ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/30 text-emerald-100 border border-emerald-400/50 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Sesi Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/30 text-amber-100 border border-amber-400/50 backdrop-blur-xs">
                <DoorClosed className="w-3.5 h-3.5 text-amber-200" />
                Belum Buka Kasir
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat datang, {profile?.full_name || 'Kasir'}
          </h1>
          <p className="text-red-100 text-sm mt-1 font-medium">
            Siap melayani pelanggan sembako dengan cepat, akurat, dan mudah.
          </p>
        </div>
        <div className="bg-black/20 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 shrink-0 flex items-center gap-2.5 text-sm font-semibold">
          <Calendar className="w-4 h-4 text-red-200" />
          <span>{today}</span>
        </div>
      </div>

      {/* Sesi Belum Dibuka Alert Banner */}
      {!isSessionOpen && !sessionLoading && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <DoorClosed className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-amber-950">
                Sesi Kasir Belum Dibuka
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Buka sesi kasir dan masukkan saldo awal uang tunai laci untuk mulai melayani transaksi di POS.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            icon={DoorOpen}
            onClick={() => setIsOpenModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-xl shrink-0"
          >
            Buka Kasir Sekarang
          </Button>
        </div>
      )}

      {/* Ringkasan Saldo Sesi Kasir Berjalan */}
      {isSessionOpen && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ringkasan Saldo Sesi Kasir Berjalan:
              </h2>
            </div>

            {/* Action Buttons: Ambil Uang & Kas Masuk */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ArrowDownLeft}
                onClick={() => handleOpenMovementModal('cash_in')}
                className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                + Kas Masuk
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={ArrowUpRight}
                onClick={() => handleOpenMovementModal('cash_out')}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                − Ambil Uang
              </Button>

              <Link to="/closing" className="text-xs font-bold text-red-600 hover:underline ml-2">
                Tutup Kasir Shift →
              </Link>
            </div>
          </div>

          {/* Grid Saldo Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Saldo Awal Tunai */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saldo Awal Tunai
                </span>
                <p className="text-base font-black text-slate-900 font-mono">
                  {formatRupiah(openingCash)}
                </p>
                <span className="text-[10px] text-slate-500 font-medium">Uang kembalian laci</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Coins size={15} />
              </div>
            </div>

            {/* Card 2: Penjualan Tunai */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penjualan Tunai
                </span>
                <p className="text-base font-black text-emerald-600 font-mono">
                  {formatRupiah(cashSales)}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {activeSession.cash_tx_count || 0} Transaksi Tunai
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Banknote size={15} />
              </div>
            </div>

            {/* Card 3: Penjualan QRIS */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penjualan QRIS
                </span>
                <p className="text-base font-black text-red-600 font-mono">
                  {formatRupiah(qrisSales)}
                </p>
                <span className="text-[10px] text-red-700 font-medium">
                  {activeSession.qris_tx_count || 0} Transaksi QRIS
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <QrCode size={15} />
              </div>
            </div>

            {/* Card 4: Penjualan Hutang */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Hutang Hari Ini (Bon)
                </span>
                <p className="text-base font-black text-amber-900 font-mono">
                  {formatRupiah(debtSales)}
                </p>
                <span className="text-[10px] text-amber-700 font-medium">
                  {activeSession.debt_tx_count || 0} Transaksi Bon
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <BookOpen size={15} />
              </div>
            </div>

            {/* Card 5: Setoran Hutang Tunai */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Bayar Hutang Tunai
                </span>
                <p className="text-base font-black text-emerald-700 font-mono">
                  {formatRupiah(cashDebtPayments)}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Masuk kas fisik
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Wallet size={15} />
              </div>
            </div>

            {/* Card 6: Kas Masuk */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Kas Masuk (Laci)
                </span>
                <p className="text-base font-black text-emerald-700 font-mono">
                  + {formatRupiah(cashIn)}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium">
                  Tambahan kembalian dll
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={15} />
              </div>
            </div>

            {/* Card 7: Kas Keluar (Ambil Uang) */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                  Kas Keluar (Ambil Uang)
                </span>
                <p className="text-base font-black text-rose-600 font-mono">
                  − {formatRupiah(cashOut)}
                </p>
                <span className="text-[10px] text-rose-500 font-medium">
                  Pengambilan laci
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <ArrowUpRight size={15} />
              </div>
            </div>

            {/* Card 8: Saldo Fisik Laci Seharusnya */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-between border border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">
                    SALDO TUNAI SEHARUSNYA
                  </span>
                </div>
                <p className="text-lg font-black text-white font-mono">
                  {formatRupiah(expectedCash)}
                </p>
                <span className="text-[10px] text-slate-400">
                  Uang fisik di laci saat ini
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Wallet size={16} />
              </div>
            </div>
          </div>

          {/* Riwayat Kas Sesi Berjalan */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Coins size={16} className="text-slate-400" />
                <span>Riwayat Kas Sesi Berjalan</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                  {movements.length} Catatan
                </span>
              </h3>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenMovementModal('cash_out')}
                  className="text-xs font-bold py-1 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  Ambil Uang
                </Button>
              </div>
            </div>

            <CashMovementHistoryTable movements={movements} />
          </div>
        </div>
      )}

      {/* Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
        <Link
          to="/pos"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-red-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900">Kasir / POS</span>
        </Link>

        <Link
          to="/debts"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-amber-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900">Hutang Pelanggan</span>
        </Link>

        <Link
          to="/quick-calculator"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-red-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calculator className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900">Kalkulator Cepat</span>
        </Link>

        <Link
          to="/transactions"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-red-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900">Riwayat Transaksi</span>
        </Link>

        <Link
          to="/closing"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-red-300 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <DoorClosed className="w-5 h-5" />
          </div>
          <span className="font-bold text-xs text-slate-900">
            {isSessionOpen ? 'Tutup Kasir (Shift)' : 'Buka Kasir'}
          </span>
        </Link>
      </div>

      {/* Modal Buka Kasir */}
      <OpenCashierModal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        onSuccess={(session) => {
          setToast({
            isOpen: true,
            message: `Kasir berhasil dibuka! Saldo awal: ${formatRupiah(session.opening_cash)}`,
            type: 'success',
          });
          refetchSession();
        }}
      />

      {/* Modal Ambil Uang / Kas Masuk */}
      {cashMovementModalState.isOpen && activeSession && (
        <CashMovementModal
          isOpen={cashMovementModalState.isOpen}
          onClose={() => setCashMovementModalState({ ...cashMovementModalState, isOpen: false })}
          sessionId={activeSession.id}
          currentAvailableCash={expectedCash}
          defaultType={cashMovementModalState.type}
          onSuccess={() => {
            refetchSession();
            refetchMovements();
            setToast({
              isOpen: true,
              message:
                cashMovementModalState.type === 'cash_out'
                  ? 'Pengambilan uang (kas keluar) berhasil dicatat!'
                  : 'Kas masuk berhasil dicatat!',
              type: 'success',
            });
          }}
        />
      )}

      {/* Toast */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default CashierDashboard;
