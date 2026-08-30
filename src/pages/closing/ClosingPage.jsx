import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { closingService } from '@/services/closingService';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
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
  ShieldCheck,
} from 'lucide-react';
import { formatRupiah, formatTanggal, formatWaktu } from '@/utils/formatters';

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

  // Query Shift Kasir Hari Ini
  const {
    data: todayShift,
    isLoading: shiftLoading,
    refetch: refetchShift,
  } = useQuery({
    queryKey: ['today-shift', user?.id],
    queryFn: () => closingService.getTodayShift(user?.id),
    enabled: !!user?.id,
  });

  // Query Penjualan & Breakdown Shift Hari Ini
  const { data: salesBreakdown = {}, isLoading: salesLoading } = useQuery({
    queryKey: ['shift-sales-breakdown', user?.id],
    queryFn: () => closingService.getShiftSalesBreakdown(user?.id),
    enabled: !!user?.id,
  });

  // Mutation 1: Buka Kasir
  const openShiftMutation = useMutation({
    mutationFn: () =>
      closingService.openShift({
        cashierId: user?.id,
        openingCash: parseRaw(openingCashInput),
        notes: openingNotes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-sales-breakdown'] });
      setToast({
        isOpen: true,
        message: 'Kasir berhasil dibuka! Selamat melayani pelanggan.',
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal membuka kasir.',
        type: 'error',
      });
    },
  });

  // Mutation 2: Tutup Kasir
  const closeShiftMutation = useMutation({
    mutationFn: () => {
      const opening = Number(todayShift?.opening_cash || 0);
      const cashSales = Number(salesBreakdown.cashSales || 0);
      const totalSales = Number(salesBreakdown.totalRevenue || 0);
      const nonCashSales = Number(salesBreakdown.nonCashSales || 0);
      const actual = parseRaw(actualCashInput);
      const systemCash = opening + cashSales;

      return closingService.closeShift({
        shiftId: todayShift?.id,
        cashierId: user?.id,
        transactionCount: salesBreakdown.transactionCount || 0,
        totalSales,
        cashSales,
        nonCashSales,
        systemCash,
        actualCash: actual,
        openingCash: opening,
        notes: closingNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shift-sales-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['closings'] });
      setToast({
        isOpen: true,
        message: 'Kasir berhasil ditutup dan laporan shift telah tercatat.',
        type: 'success',
      });
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Gagal menutup kasir.',
        type: 'error',
      });
    },
  });

  // Hitung total dari pecahan uang
  const handleDenomChange = (val, key) => {
    const nextDenoms = { ...denoms, [key]: val };
    setDenoms(nextDenoms);

    let calculatedTotal = 0;
    Object.entries(nextDenoms).forEach(([k, count]) => {
      if (k === 'coins') {
        calculatedTotal += parseRaw(count);
      } else {
        calculatedTotal += Number(k) * (parseRaw(count) || 0);
      }
    });

    setActualCashInput(calculatedTotal > 0 ? String(calculatedTotal) : '');
  };

  const isLoading = shiftLoading || salesLoading;

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner size="lg" message="Memeriksa status shift kasir..." />
      </div>
    );
  }

  // Perhitungan Data Shift
  const openingCash = Number(todayShift?.opening_cash || 0);
  const totalRevenue = Number(salesBreakdown.totalRevenue || 0);
  const cashSales = Number(salesBreakdown.cashSales || 0);
  const nonCashSales = Number(salesBreakdown.nonCashSales || 0);
  const transactionCount = Number(salesBreakdown.transactionCount || 0);
  
  // Total kas di laci menurut sistem = Modal Awal + Penjualan Tunai
  const expectedDrawerCash = openingCash + cashSales;
  const actualCash = parseRaw(actualCashInput);
  const difference = actualCash > 0 ? actualCash - expectedDrawerCash : 0;

  const isShiftOpen = todayShift && todayShift.status === 'open';
  const isShiftClosed = todayShift && todayShift.status === 'closed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Buka & Tutup Kasir' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl border shrink-0 ${
              isShiftOpen
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : isShiftClosed
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-red-50 text-red-600 border-red-100'
            }`}
          >
            {isShiftOpen ? <DoorOpen className="w-6 h-6" /> : <DoorClosed className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Buka & Tutup Kasir
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                  isShiftOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse'
                    : isShiftClosed
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {isShiftOpen ? '🟢 SHIFT AKTIF' : isShiftClosed ? '🔒 SHIFT DITUTUP' : '⚪ BELUM BUKA'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manajemen shift kasir, modal awal & rekonsiliasi kas harian &bull; {profile?.full_name}
            </p>
          </div>
        </div>

        {isShiftOpen && (
          <Link to="/pos">
            <Button
              variant="primary"
              icon={ShoppingCart}
              className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/25 rounded-xl text-sm"
            >
              Buka Terminal POS
            </Button>
          </Link>
        )}
      </div>

      {/* ========================================================================= */}
      {/* KONDISI 1: SHIFT BELUM DIBUKA (BUKA KASIR) */}
      {/* ========================================================================= */}
      {!todayShift && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Buka Kasir */}
          <div className="lg:col-span-7 space-y-4">
            <Card
              header={
                <div className="flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-sm text-slate-900">Form Buka Shift Kasir</span>
                </div>
              }
              bodyClassName="p-5 sm:p-6 space-y-4"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Modal Awal Kasir / Uang Kembalian di Laci (Rp)
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
                    className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-right text-xl font-black outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Preset Nominal Modal Awal */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Pilihan Cepat Modal Awal:
                </span>
                <div className="flex flex-wrap gap-2">
                  {INITIAL_CASH_PRESETS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setOpeningCashInput(String(amt))}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        parseRaw(openingCashInput) === amt
                          ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/25'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Catatan Pembukaan Shift (opsional)
                </label>
                <textarea
                  value={openingNotes}
                  onChange={(e) => setOpeningNotes(e.target.value)}
                  placeholder="Mis. Uang receh 2rb ada 20 lembar, koin 500 ada 50 keping..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium resize-none"
                />
              </div>

              <Button
                onClick={() => openShiftMutation.mutate()}
                isLoading={openShiftMutation.isPending}
                disabled={openShiftMutation.isPending}
                variant="primary"
                icon={DoorOpen}
                className="w-full py-4 text-base font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-500/25 rounded-xl cursor-pointer"
              >
                Buka Kasir Sekarang & Mulai Transaksi
              </Button>
            </Card>
          </div>

          {/* Info Petunjuk */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 shadow-xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">Kenapa Perlu Buka Kasir?</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Fitur Buka Kasir mencatat uang modal awal (pecahan kembalian) di laci kasir agar saat toko tutup di akhir hari, rekonsiliasi uang kas fisik dan penjualan sistem dapat dihitung secara akurat tanpa selisih.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Hitung uang fisik di laci kasir</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ketik modal awal & konfirmasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Terminal POS langsung siap digunakan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONDISI 2: SHIFT SEDANG AKTIF (TUTUP KASIR FORM) */}
      {/* ========================================================================= */}
      {isShiftOpen && (
        <div className="space-y-6">
          {/* Stat Cards Shift Berjalan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Modal Awal */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Modal Awal Kas</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono mt-2">
                {formatRupiah(openingCash)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Dibuka {formatWaktu(todayShift.opened_at)} WIB
              </p>
            </div>

            {/* Penjualan Tunai */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Penjualan Tunai</span>
                <Banknote className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-600 font-mono mt-2">
                {formatRupiah(cashSales)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Masuk ke laci kasir
              </p>
            </div>

            {/* Penjualan Non-Tunai */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>QRIS & Transfer</span>
                <QrCode className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-2xl font-black text-sky-600 font-mono mt-2">
                {formatRupiah(nonCashSales)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Langsung ke rekening toko
              </p>
            </div>

            {/* Total Kas Seharusnya di Laci */}
            <div className="p-5 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-2xl shadow-md shadow-red-500/20 border border-red-500">
              <div className="flex items-center justify-between text-xs text-red-100 font-bold uppercase">
                <span>Total Kas di Laci</span>
                <Coins className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-black text-white font-mono mt-2">
                {formatRupiah(expectedDrawerCash)}
              </p>
              <p className="text-[11px] text-red-200 mt-1">
                Modal ({formatRupiah(openingCash)}) + Tunai ({formatRupiah(cashSales)})
              </p>
            </div>
          </div>

          {/* Form Tutup Kasir */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <Card
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DoorClosed className="w-5 h-5 text-red-600" />
                      <span className="font-bold text-sm text-slate-900">Form Tutup Kasir (Closing Shift)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDenomCounter(!showDenomCounter)}
                      className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>{showDenomCounter ? 'Tutup Hitung Pecahan' : 'Hitung Pecahan Uang'}</span>
                    </button>
                  </div>
                }
                bodyClassName="p-5 sm:p-6 space-y-4"
              >
                {/* Hitung Pecahan Uang Dropdown */}
                {showDenomCounter && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Kalkulator Pecahan Uang Kertas & Koin:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { key: '100000', label: 'Rp 100.000' },
                        { key: '50000', label: 'Rp 50.000' },
                        { key: '20000', label: 'Rp 20.000' },
                        { key: '10000', label: 'Rp 10.000' },
                        { key: '5000', label: 'Rp 5.000' },
                        { key: '2000', label: 'Rp 2.000' },
                        { key: '1000', label: 'Rp 1.000' },
                        { key: 'coins', label: 'Total Koin (Rp)' },
                      ].map((item) => (
                        <div key={item.key}>
                          <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                            {item.label}
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={denoms[item.key]}
                            onChange={(e) => handleDenomChange(e.target.value.replace(/\D/g, ''), item.key)}
                            placeholder={item.key === 'coins' ? '0' : '0 lbr'}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right font-mono outline-none focus:border-red-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Total Uang Fisik Aktual */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Total Uang Fisik Kas di Laci (Rp)
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
                      className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-200 rounded-xl text-right text-xl font-black outline-none focus:border-red-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Indikator Selisih Kas */}
                {actualCash > 0 && (
                  <div
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      difference === 0
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : difference > 0
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle
                        className={`w-5 h-5 ${
                          difference === 0
                            ? 'text-emerald-600'
                            : difference > 0
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-xs">
                          {difference === 0
                            ? 'Uang Kas Pas (Sesuai Sistem)'
                            : difference > 0
                            ? 'Kelebihan Uang Kas'
                            : 'Kekurangan Uang Kas'}
                        </p>
                        <p className="text-[11px] opacity-80">
                          {difference === 0
                            ? 'Fisik kas tepat sama dengan estimasi sistem'
                            : difference > 0
                            ? `Ada kelebihan uang fisik sebesar ${formatRupiah(difference)}`
                            : `Ada selisih minus sebesar ${formatRupiah(Math.abs(difference))}`}
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-black font-mono">
                      {difference > 0 ? '+' : ''}
                      {formatRupiah(difference)}
                    </span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Catatan Penutupan Shift (opsional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Keterangan jika ada selisih uang, pengeluaran kas toko, atau titipan..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-red-500 font-medium resize-none"
                  />
                </div>

                <Button
                  onClick={() => closeShiftMutation.mutate()}
                  isLoading={closeShiftMutation.isPending}
                  disabled={!actualCash || closeShiftMutation.isPending}
                  variant="primary"
                  icon={DoorClosed}
                  className="w-full py-4 text-base font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-500/25 rounded-xl cursor-pointer"
                >
                  Tutup Kasir & Selesaikan Shift Hari Ini
                </Button>
              </Card>
            </div>

            {/* Ringkasan Shift Samping */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ringkasan Transaksi Shift
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {transactionCount} Transaksi
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Modal Awal Kas</span>
                    <span className="font-bold text-slate-900 font-mono">{formatRupiah(openingCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penjualan Tunai</span>
                    <span className="font-bold text-emerald-600 font-mono">+{formatRupiah(cashSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penjualan QRIS & Transfer</span>
                    <span className="font-bold text-sky-600 font-mono">+{formatRupiah(nonCashSales)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 font-bold">
                    <span className="text-slate-800">Total Omzet Penjualan</span>
                    <span className="text-red-600 font-mono text-sm">{formatRupiah(totalRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONDISI 3: SHIFT SUDAH DITUTUP (REKAP SELESAI) */}
      {/* ========================================================================= */}
      {isShiftClosed && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 text-center shadow-lg space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Kasir Berhasil Ditutup
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Laporan shift kasir telah tersimpan di database pada{' '}
                {formatTanggal(todayShift.closing_date)} &bull; {formatWaktu(todayShift.closed_at)} WIB
              </p>
            </div>

            {/* Rincian Struk Closing */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Kasir</span>
                <span className="font-bold text-slate-900">{profile?.full_name || 'Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Transaksi</span>
                <span className="font-bold text-slate-900">{todayShift.transaction_count} Transaksi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Modal Awal</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(todayShift.opening_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Total Penjualan</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(todayShift.total_sales)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Estimasi Kas di Laci</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(todayShift.system_cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Uang Kas Aktual</span>
                <span className="font-bold text-slate-900 font-mono">{formatRupiah(todayShift.actual_cash)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 font-bold text-sm">
                <span className="text-slate-800">Selisih Kas</span>
                <span
                  className={`font-mono ${
                    Number(todayShift.difference) === 0
                      ? 'text-emerald-600'
                      : Number(todayShift.difference) > 0
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {Number(todayShift.difference) > 0 ? '+' : ''}
                  {formatRupiah(todayShift.difference)}
                </span>
              </div>

              {todayShift.notes && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 mt-2">
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Catatan:</p>
                  <p className="text-xs mt-0.5">{todayShift.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                icon={Printer}
                onClick={() => window.print()}
                className="flex-1 py-3 font-bold text-xs rounded-xl"
              >
                Cetak Rekap Closing
              </Button>
              <Button
                variant="primary"
                icon={RotateCcw}
                onClick={() => {
                  refetchShift();
                }}
                className="flex-1 py-3 font-bold text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-500/20"
              >
                Segarkan Data
              </Button>
            </div>
          </div>
        </div>
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
