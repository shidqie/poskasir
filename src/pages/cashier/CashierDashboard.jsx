import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cashierSessionService } from '@/services/cashierSessionService';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { CashierSessionStatusBadge } from '@/components/cashier/CashierSessionStatusBadge';
import { OpenCashierModal } from '@/components/cashier/OpenCashierModal';
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
} from 'lucide-react';
import { formatTanggal, formatRupiah, formatTanggalWaktu } from '@/utils/formatters';

export function CashierDashboard() {
  const { profile, user } = useAuthStore();
  const today = formatTanggal(new Date(), 'DD MMMM YYYY');
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Sesi Kasir Aktif
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

  const isSessionOpen = activeSession && activeSession.status === 'open';
  const openingCash = Number(activeSession?.opening_cash || 0);
  const cashSales = Number(activeSession?.cash_sales || 0);
  const qrisSales = Number(activeSession?.qris_sales || 0);
  const totalSales = Number(activeSession?.total_sales || 0);
  const expectedCash = openingCash + cashSales;

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

      {/* 5 Ringkasan Saldo Sesi Kasir Berjalan (PROMPT SECTION 11 & 12) */}
      {isSessionOpen && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ringkasan Saldo Sesi Kasir Berjalan:
            </h2>
            <Link to="/closing" className="text-xs font-bold text-red-600 hover:underline">
              Tutup Kasir Shift →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Card 1: Saldo Awal Tunai */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saldo Awal Tunai
                </span>
                <p className="text-lg font-black text-slate-900 font-mono">
                  {formatRupiah(openingCash)}
                </p>
                <span className="text-[10px] text-slate-500 font-medium">Uang kembalian laci</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Coins size={16} />
              </div>
            </div>

            {/* Card 2: Penjualan Tunai */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penjualan Tunai
                </span>
                <p className="text-lg font-black text-emerald-600 font-mono">
                  {formatRupiah(cashSales)}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium">
                  {activeSession.cash_tx_count || 0} Transaksi Tunai
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Banknote size={16} />
              </div>
            </div>

            {/* Card 3: Penjualan QRIS */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Penjualan QRIS
                </span>
                <p className="text-lg font-black text-red-600 font-mono">
                  {formatRupiah(qrisSales)}
                </p>
                <span className="text-[10px] text-red-700 font-medium">
                  {activeSession.qris_tx_count || 0} Transaksi QRIS
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <QrCode size={16} />
              </div>
            </div>

            {/* Card 4: Total Penjualan */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Penjualan Sesi Ini
                </span>
                <p className="text-lg font-black text-slate-900 font-mono">
                  {formatRupiah(totalSales)}
                </p>
                <span className="text-[10px] text-slate-500 font-medium">
                  {activeSession.transaction_count || 0} Total Nota
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
                <Receipt size={16} />
              </div>
            </div>

            {/* Card 5: Saldo Tunai Seharusnya (Laci Fisik) */}
            <div className="sm:col-span-2 lg:col-span-2 p-4 bg-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-between border border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">
                    SALDO TUNAI SEHARUSNYA (FISIK LACI)
                  </span>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-mono">
                    Saldo Awal + Penjualan Tunai
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatRupiah(expectedCash)}
                </p>
                <span className="text-[10px] text-slate-400">
                  *Pendapatan QRIS ({formatRupiah(qrisSales)}) tidak menambah fisik laci.
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Wallet size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
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
