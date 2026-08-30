import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { cashierSessionService } from '@/services/cashierSessionService';
import { cashMovementService } from '@/services/cashMovementService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { CashierSessionStatusBadge } from '@/components/cashier/CashierSessionStatusBadge';
import { CashMovementModal } from '@/components/cashier/CashMovementModal';
import { CashMovementHistoryTable } from '@/components/cashier/CashMovementHistoryTable';
import { Link } from 'react-router-dom';
import {
  DoorOpen,
  DoorClosed,
  CheckCircle2,
  AlertCircle,
  Coins,
  Receipt,
  ShoppingCart,
  Printer,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Calculator,
  QrCode,
  Banknote,
  Clock,
  User,
  ShieldCheck,
  TrendingUp,
  Wallet,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatWaktu, formatTanggalWaktu } from '@/utils/formatters';

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

const INITIAL_CASH_PRESETS = [50000, 100000, 200000, 300000, 500000];

export default function ClosingPage() {
  const { user, profile } = useAuthStore();
  const queryClient = useQueryClient();

  // Form states
  const [openingCashInput, setOpeningCashInput] = useState('200000');
  const [actualCashInput, setActualCashInput] = useState('');
  const [openingNotes, setOpeningNotes] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [closedSessionData, setClosedSessionData] = useState(null);
  const [cashMovementModalState, setCashMovementModalState] = useState({
    isOpen: false,
    type: 'cash_out',
  });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [showDenomCounter, setShowDenomCounter] = useState(false);

  // Cash Denomination Breakdown Helper State
  const [denoms, setDenoms] = useState({
    100000: '',
    50000: '',
    20000: '',
    10000: '',
    5000: '',
    2000: '',
    1000: '',
    coins: '',
  });

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

  // 2. Query Pergerakan Kas Sesi Aktif
  const { data: movements = [], refetch: refetchMovements } = useQuery({
    queryKey: ['session-cash-movements', activeSession?.id],
    queryFn: () => cashMovementService.getSessionCashMovements(activeSession?.id),
    enabled: Boolean(activeSession?.id),
    refetchInterval: 10000,
  });

  // Update actual cash input when denoms change
  useEffect(() => {
    if (showDenomCounter) {
      const total =
        parseRaw(denoms[100000]) * 100000 +
        parseRaw(denoms[50000]) * 50000 +
        parseRaw(denoms[20000]) * 20000 +
        parseRaw(denoms[10000]) * 10000 +
        parseRaw(denoms[5000]) * 5000 +
        parseRaw(denoms[2000]) * 2000 +
        parseRaw(denoms[1000]) * 1000 +
        parseRaw(denoms.coins);
      setActualCashInput(total > 0 ? String(total) : '');
    }
  }, [denoms, showDenomCounter]);

  // Mutation: Buka Kasir
  const openSessionMutation = useMutation({
    mutationFn: () =>
      cashierSessionService.openSession({
        opening_cash: parseRaw(openingCashInput),
        notes: openingNotes,
      }),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] });
      setClosedSessionData(null);
      setToast({
        isOpen: true,
        message: `Kasir berhasil dibuka! Saldo awal: ${formatRupiah(session.opening_cash)}`,
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal membuka sesi kasir.',
        type: 'error',
      });
    },
  });

  // Mutation: Tutup Kasir
  const closeSessionMutation = useMutation({
    mutationFn: () => {
      if (!activeSession) throw new Error('Tidak ada sesi kasir aktif.');
      return cashierSessionService.closeSession({
        session_id: activeSession.id,
        actual_cash: parseRaw(actualCashInput),
        notes: closingNotes,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] });
      queryClient.invalidateQueries({ queryKey: ['all-cashier-sessions'] });
      setClosedSessionData(res.session);
      setToast({
        isOpen: true,
        message: 'Sesi kasir berhasil ditutup!',
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menutup sesi kasir.',
        type: 'error',
      });
    },
  });

  const handleDenomChange = (denomKey, value) => {
    const clean = value.replace(/\D/g, '');
    setDenoms((prev) => ({ ...prev, [denomKey]: clean }));
  };

  const handlePrint = () => {
    window.print();
  };

  const isSessionOpen = activeSession && activeSession.status === 'open';

  // Perhitungan Nilai Real-time
  const openingCash = Number(activeSession?.opening_cash || 0);
  const cashSales = Number(activeSession?.cash_sales || 0);
  const qrisSales = Number(activeSession?.qris_sales || 0);
  const debtSales = Number(activeSession?.debt_sales || 0);
  const totalSales = Number(activeSession?.total_sales || 0);
  const cashDebtPayments = Number(activeSession?.cash_debt_payments || 0);
  const qrisDebtPayments = Number(activeSession?.qris_debt_payments || 0);
  const cashIn = Number(activeSession?.cash_in || 0);
  const cashOut = Number(activeSession?.cash_out || 0);

  // Saldo Tunai Seharusnya: Saldo Awal + Penjualan Tunai + Pembayaran Hutang Tunai + Kas Masuk - Kas Keluar
  const expectedCash = openingCash + cashSales + cashDebtPayments + cashIn - cashOut;
  const actualCash = parseRaw(actualCashInput);
  const diffCash = actualCashInput !== '' ? actualCash - expectedCash : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Buka & Tutup Kasir' }]} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 rounded-3xl p-6 text-white shadow-xl shadow-red-600/15 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-red-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5" />
              Manajemen Sesi Kasir Toko
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Buka & Tutup Kasir (Shift)
          </h1>
          <p className="text-red-100 text-xs sm:text-sm mt-0.5 font-medium">
            Kelola modal awal laci, omzet Tunai & QRIS, Kas Masuk/Keluar, dan rekonsiliasi uang fisik.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {isSessionOpen ? (
            <span className="px-3.5 py-2 rounded-2xl bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 font-bold text-xs flex items-center gap-2 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sesi Sedang Aktif
            </span>
          ) : (
            <span className="px-3.5 py-2 rounded-2xl bg-black/20 border border-white/20 text-red-100 font-bold text-xs flex items-center gap-2 backdrop-blur-xs">
              <DoorClosed className="w-4 h-4 text-red-200" />
              Belum Buka Kasir
            </span>
          )}
        </div>
      </div>

      {sessionLoading ? (
        <div className="py-20 text-center">
          <LoadingSpinner size="md" message="Memeriksa status sesi kasir..." />
        </div>
      ) : isSessionOpen ? (
        /* ========================================================================= */
        /* STATE 2: SESI SEDANG BERJALAN & FORM TUTUP KASIR                          */
        /* ========================================================================= */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sesi Status Card */}
          <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Sesi Kasir: {profile?.full_name || 'Kasir'}
                  </h3>
                  <CashierSessionStatusBadge status="open" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dibuka pada {formatTanggalWaktu(activeSession.opened_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ArrowDownLeft}
                onClick={() => setCashMovementModalState({ isOpen: true, type: 'cash_in' })}
                className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                + Kas Masuk
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={ArrowUpRight}
                onClick={() => setCashMovementModalState({ isOpen: true, type: 'cash_out' })}
                className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                − Ambil Uang
              </Button>

              <Link to="/pos">
                <Button
                  type="button"
                  variant="primary"
                  icon={ShoppingCart}
                  className="text-xs py-2 px-3.5 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs"
                >
                  Buka POS
                </Button>
              </Link>
            </div>
          </div>

          {/* 8 Ringkasan Saldo Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Saldo Awal Tunai */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Saldo Awal Tunai (Laci)
                </span>
                <p className="text-lg font-black text-slate-900 font-mono">
                  {formatRupiah(openingCash)}
                </p>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Modal kembalian awal
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                <Coins size={16} />
              </div>
            </div>

            {/* Card 2: Penjualan Tunai */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Penjualan Tunai
                </span>
                <p className="text-lg font-black text-emerald-600 font-mono">
                  {formatRupiah(cashSales)}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium block">
                  {activeSession.cash_tx_count || 0} Transaksi Tunai
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                <Banknote size={16} />
              </div>
            </div>

            {/* Card 3: Penjualan QRIS */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Penjualan QRIS (Digital)
                </span>
                <p className="text-lg font-black text-red-600 font-mono">
                  {formatRupiah(qrisSales)}
                </p>
                <span className="text-[10px] text-red-700 font-medium block">
                  {activeSession.qris_tx_count || 0} Transaksi QRIS
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center shrink-0">
                <QrCode size={16} />
              </div>
            </div>

            {/* Card 4: Penjualan Hutang (Piutang) */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider block">
                  Penjualan Hutang (Bon)
                </span>
                <p className="text-lg font-black text-amber-900 font-mono">
                  {formatRupiah(debtSales)}
                </p>
                <span className="text-[10px] text-amber-700 font-medium block">
                  {activeSession.debt_tx_count || 0} Transaksi Bon
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </div>
            </div>

            {/* Card 5: Setoran Hutang Tunai */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Bayar Hutang Tunai
                </span>
                <p className="text-lg font-black text-emerald-700 font-mono">
                  {formatRupiah(cashDebtPayments)}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Masuk fisik laci
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Wallet size={16} />
              </div>
            </div>

            {/* Card 6: Kas Masuk */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  Kas Masuk (Laci)
                </span>
                <p className="text-lg font-black text-emerald-700 font-mono">
                  + {formatRupiah(cashIn)}
                </p>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Tambahan uang fisik
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <ArrowDownLeft size={16} />
              </div>
            </div>

            {/* Card 7: Kas Keluar (Ambil Uang) */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider block">
                  Kas Keluar (Ambil Uang)
                </span>
                <p className="text-lg font-black text-rose-600 font-mono">
                  − {formatRupiah(cashOut)}
                </p>
                <span className="text-[10px] text-rose-500 font-medium block">
                  Pengambilan kas laci
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} />
              </div>
            </div>

            {/* Card 8: Setoran Hutang QRIS */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Bayar Hutang QRIS
                </span>
                <p className="text-lg font-black text-slate-800 font-mono">
                  {formatRupiah(qrisDebtPayments)}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block">
                  Penerimaan digital
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                <QrCode size={16} />
              </div>
            </div>

            {/* Card Utama: Saldo Tunai Seharusnya */}
            <div className="sm:col-span-2 lg:col-span-4 p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl shadow-md flex items-center justify-between border border-slate-700">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    SALDO TUNAI SEHARUSNYA DI LACI (FISIK)
                  </span>
                  <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
                    Saldo Awal + Tunai + Setoran Tunai + Kas Masuk − Kas Keluar
                  </span>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                  {formatRupiah(expectedCash)}
                </p>
                <p className="text-[11px] text-slate-300">
                  *Penjualan Hutang ({formatRupiah(debtSales)}) & QRIS ({formatRupiah(qrisSales)}) tidak masuk laci uang fisik.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Riwayat Kas Masuk & Keluar Sesi Ini */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Coins size={16} className="text-slate-400" />
                <span>Riwayat Kas Sesi Ini</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
                  {movements.length} Catatan
                </span>
              </h3>
            </div>
            <CashMovementHistoryTable movements={movements} />
          </div>

          {/* Form Rekonsiliasi Uang Aktual Laci & Tutup Kasir */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Hitung Uang Fisik Laci Kasir & Tutup Sesi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hitung seluruh uang tunai yang ada di laci kasir saat ini untuk rekonsiliasi selisih kas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDenomCounter(!showDenomCounter)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-red-300 transition-colors cursor-pointer"
              >
                <Calculator size={14} className="text-red-600" />
                <span>{showDenomCounter ? 'Tutup Kalkulator Pecahan' : 'Buka Kalkulator Pecahan'}</span>
              </button>
            </div>

            {/* Kalkulator Pecahan Uang Kertas & Koin */}
            {showDenomCounter && (
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Kalkulator Jumlah Lembar Pecahan Uang:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { key: 100000, label: 'Rp 100.000' },
                    { key: 50000, label: 'Rp 50.000' },
                    { key: 20000, label: 'Rp 20.000' },
                    { key: 10000, label: 'Rp 10.000' },
                    { key: 5000, label: 'Rp 5.000' },
                    { key: 2000, label: 'Rp 2.000' },
                    { key: 1000, label: 'Rp 1.000' },
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        {label}
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={denoms[key]}
                          onChange={(e) => handleDenomChange(key, e.target.value)}
                          placeholder="0"
                          className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs outline-none focus:border-red-500"
                        />
                        <span className="text-[10px] text-slate-400 font-medium">lbr</span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Total Koin (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={denoms.coins ? Number(denoms.coins).toLocaleString('id-ID') : ''}
                      onChange={(e) => handleDenomChange('coins', e.target.value)}
                      placeholder="0"
                      className="w-full px-2 py-1 border border-slate-200 rounded-lg text-right font-mono font-bold text-xs outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Input Uang Tunai Aktual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Uang Tunai Aktual di Laci (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      actualCashInput
                        ? Number(actualCashInput.replace(/\D/g, '')).toLocaleString('id-ID')
                        : ''
                    }
                    onChange={(e) => setActualCashInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl text-right text-xl font-black outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Status Selisih Visual Indicator */}
              <div className="flex flex-col justify-end">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Status Rekonsiliasi Selisih:
                </span>
                <div
                  className={`p-3.5 rounded-2xl border flex items-center justify-between font-mono ${
                    diffCash === null
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : diffCash === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                      : diffCash < 0
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-bold'
                      : 'bg-amber-50 border-amber-300 text-amber-800 font-bold'
                  }`}
                >
                  <span className="text-xs font-sans font-bold">
                    {diffCash === null
                      ? 'Masukkan uang aktual'
                      : diffCash === 0
                      ? '🟢 Sesuai (Pas)'
                      : diffCash < 0
                      ? `🔴 Kurang ${formatRupiah(Math.abs(diffCash))}`
                      : `🟡 Lebih ${formatRupiah(diffCash)}`}
                  </span>
                  <span className="text-sm font-black font-mono">
                    {diffCash === null
                      ? 'Rp 0'
                      : diffCash === 0
                      ? 'Rp 0'
                      : diffCash < 0
                      ? `-${formatRupiah(Math.abs(diffCash))}`
                      : `+${formatRupiah(diffCash)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Penutupan */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Catatan Tutup Kasir (opsional)
              </label>
              <textarea
                value={closingNotes}
                onChange={(e) => setClosingNotes(e.target.value)}
                placeholder="Tuliskan keterangan jika ada selisih uang, uang diambil pemilik, dll..."
                rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Tombol Aksi Tutup Kasir */}
            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                variant="primary"
                icon={DoorClosed}
                isLoading={closeSessionMutation.isPending}
                disabled={closeSessionMutation.isPending || actualCashInput === ''}
                onClick={() => closeSessionMutation.mutate()}
                className="w-full sm:w-auto py-3.5 px-8 text-sm font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-500/25 cursor-pointer"
              >
                Tutup Kasir Sekarang
              </Button>
            </div>
          </div>
        </div>
      ) : closedSessionData ? (
        /* ========================================================================= */
        /* STATE 3: STRUK CLOSING & RINGKASAN SETELAH DITUTUP                        */
        /* ========================================================================= */
        <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
          <div className="text-center space-y-2 pb-4 border-b border-dashed border-slate-200">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="text-lg font-black text-slate-900">Sesi Kasir Berhasil Ditutup</h2>
            <p className="text-xs text-slate-500">
              ID Sesi: #{closedSessionData.id?.slice(0, 8)} &bull; Kasir: {profile?.full_name || 'Kasir'}
            </p>
          </div>

          {/* Struk Details */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Buka:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatTanggalWaktu(closedSessionData.opened_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Waktu Tutup:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatTanggalWaktu(closedSessionData.closed_at)}
              </span>
            </div>
            <div className="h-px bg-slate-100 my-2" />

            <div className="flex justify-between">
              <span className="text-slate-500">Saldo Awal Tunai:</span>
              <span className="font-bold text-slate-900 font-mono">
                {formatRupiah(closedSessionData.opening_cash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                Penjualan Tunai ({closedSessionData.cash_tx_count || 0} trx):
              </span>
              <span className="font-bold text-emerald-600 font-mono">
                {formatRupiah(closedSessionData.cash_sales)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">
                Penjualan QRIS ({closedSessionData.qris_tx_count || 0} trx):
              </span>
              <span className="font-bold text-red-600 font-mono">
                {formatRupiah(closedSessionData.qris_sales)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>Total Penjualan:</span>
              <span className="font-mono text-sm">{formatRupiah(closedSessionData.total_sales)}</span>
            </div>

            <div className="h-px bg-slate-200 my-2" />

            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">Saldo Tunai Seharusnya:</span>
              <span className="font-black text-slate-900 font-mono">
                {formatRupiah(closedSessionData.expected_cash)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-bold">Uang Fisik Aktual:</span>
              <span className="font-black text-slate-900 font-mono">
                {formatRupiah(closedSessionData.actual_cash)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-700">Selisih Kas:</span>
              <span
                className={`font-black text-sm font-mono px-2 py-0.5 rounded-lg ${
                  closedSessionData.cash_difference === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : closedSessionData.cash_difference < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {closedSessionData.cash_difference === 0
                  ? 'Sesuai (Rp 0)'
                  : closedSessionData.cash_difference < 0
                  ? `Kurang ${formatRupiah(Math.abs(closedSessionData.cash_difference))}`
                  : `Lebih ${formatRupiah(closedSessionData.cash_difference)}`}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              icon={Printer}
              onClick={handlePrint}
              className="w-full py-2.5 text-xs font-bold rounded-xl"
            >
              Cetak Struk Closing
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={DoorOpen}
              onClick={() => {
                setClosedSessionData(null);
                setActualCashInput('');
                refetchSession();
              }}
              className="w-full py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
            >
              Buka Sesi Kasir Baru
            </Button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* STATE 1: FORM BUKA KASIR (BELUM ADA SESI AKTIF)                           */
        /* ========================================================================= */
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-5 animate-in fade-in duration-300">
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto border border-red-200/80 mb-2">
              <DoorOpen size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Buka Sesi Kasir Baru
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sebelum memulai melayani transaksi di POS, masukkan saldo awal uang tunai fisik yang ada di laci kasir.
            </p>
          </div>

          {/* Info Kasir */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Petugas Kasir:</span>
              <span className="font-bold text-slate-900">{profile?.full_name || 'Kasir'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Waktu Sekarang:</span>
              <span className="font-bold text-slate-900">
                {formatTanggal(new Date())} &bull; {formatWaktu(new Date())} WIB
              </span>
            </div>
          </div>

          {/* Input Saldo Awal Tunai */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Saldo Awal Tunai Laci (Rp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    openingCashInput
                      ? Number(openingCashInput.replace(/\D/g, '')).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => setOpeningCashInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-2xl text-right text-xl font-black outline-none focus:border-red-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Quick Chips */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Pilihan Cepat Saldo Awal:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INITIAL_CASH_PRESETS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setOpeningCashInput(String(amt))}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      parseRaw(openingCashInput) === amt
                        ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700'
                    }`}
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan Awal */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Catatan Awal Sesi (opsional)
              </label>
              <textarea
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                placeholder="Contoh: Pecahan 2rb ada 20 lbr, 5rb ada 10 lbr..."
                rows={2}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Submit Buka Kasir */}
            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                icon={DoorOpen}
                isLoading={openSessionMutation.isPending}
                disabled={openSessionMutation.isPending}
                onClick={() => openSessionMutation.mutate()}
                className="w-full py-3.5 text-sm font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-500/25 cursor-pointer"
              >
                Buka Kasir Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}
