import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/utils/formatters';
import {
  generateEMVCoQRIS,
  convertStaticToDynamic,
  crc16,
  WARUNG_GARINUL_STATIC_QRIS,
  MIN_QRIS_AMOUNT,
} from '@/utils/qrisHelper';
import {
  QrCode,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Smartphone,
  Copy,
  Check,
  Edit3,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  X,
  Store,
  ShieldCheck,
} from 'lucide-react';

export function QRISDisplay({
  totalAmount,
  merchantName = 'WARUNG GARINUL, PACET',
  nmid = 'ID1025414908653',
}) {
  const [qrisMode, setQrisMode] = useState('dynamic'); // 'dynamic' | 'static'
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [isCopied, setIsCopied] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customStaticQRIS, setCustomStaticQRIS] = useState(() => {
    return localStorage.getItem('store_custom_static_qris') || '';
  });
  const [showConfig, setShowConfig] = useState(false);
  const [inputCustomQRIS, setInputCustomQRIS] = useState(customStaticQRIS);

  const isBelowMinAmount = Number(totalAmount || 0) < MIN_QRIS_AMOUNT;

  // Generate payload menggunakan base QRIS resmi Warung Garinul
  const currentQRISPayload = useMemo(() => {
    const baseStatic = customStaticQRIS.trim() || WARUNG_GARINUL_STATIC_QRIS;
    if (qrisMode === 'dynamic') {
      return convertStaticToDynamic(baseStatic, totalAmount);
    }
    return baseStatic;
  }, [customStaticQRIS, qrisMode, totalAmount]);

  // Countdown timer for dynamic QRIS
  useEffect(() => {
    if (qrisMode !== 'dynamic') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [qrisMode]);

  // Keyboard shortcut to close fullscreen customer modal on Escape
  useEffect(() => {
    if (!isCustomerModalOpen) return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        setIsCustomerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isCustomerModalOpen]);

  const handleCopyPayload = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentQRISPayload);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSaveCustomQRIS = (e) => {
    e.preventDefault();
    const clean = inputCustomQRIS.trim();
    setCustomStaticQRIS(clean);
    if (clean) {
      localStorage.setItem('store_custom_static_qris', clean);
    } else {
      localStorage.removeItem('store_custom_static_qris');
    }
    setShowConfig(false);
  };

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-3">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setQrisMode('dynamic');
            setTimeLeft(300);
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrisMode === 'dynamic'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>QRIS Dinamis</span>
        </button>

        <button
          type="button"
          onClick={() => setQrisMode('static')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrisMode === 'static'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QRIS Statis</span>
        </button>
      </div>

      {/* QRIS Card Display */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
        {/* Header QRIS Logo & Merchant Name */}
        <div className="w-full pb-2.5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {merchantName}
            </h4>
            <p className="text-[11px] font-mono text-slate-500 font-semibold mt-0.5">
              NMID: {nmid} &bull; A01
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-black tracking-wider border ${
                qrisMode === 'dynamic'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {qrisMode === 'dynamic' ? 'DINAMIS' : 'STATIS'}
            </span>

            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Pengaturan QRIS Toko"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Config / Custom Static QRIS String Box */}
        {showConfig && (
          <form
            onSubmit={handleSaveCustomQRIS}
            className="w-full p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 animate-in fade-in duration-200 text-xs"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800">Custom String QRIS Toko (Opsional)</span>
              {customStaticQRIS && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStaticQRIS('');
                    setInputCustomQRIS('');
                    localStorage.removeItem('store_custom_static_qris');
                  }}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  Reset Default
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Jika toko memiliki stiker QRIS resmi dari bank (BCA, BRI, Nobu, GoPay), paste string hasil scan stiker di sini agar langsung otomatis tersambung:
            </p>
            <textarea
              value={inputCustomQRIS}
              onChange={(e) => setInputCustomQRIS(e.target.value)}
              placeholder="00020101021126..."
              rows={2}
              className="w-full p-2 border border-slate-200 rounded-xl font-mono text-[11px] outline-none focus:border-red-500 bg-white"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-200 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
              >
                Simpan
              </button>
            </div>
          </form>
        )}

        {/* QR Code Container with Click-to-Fullscreen feature */}
        <div
          onClick={() => setIsCustomerModalOpen(true)}
          className="relative group p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center cursor-pointer hover:border-red-600 transition-all hover:shadow-xl"
          title="Klik untuk tampilkan layar penuh ke konsumen"
        >
          <QRCodeSVG
            value={currentQRISPayload}
            size={190}
            level="M"
            includeMargin={false}
          />

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 p-3">
            <Maximize2 size={24} className="text-white animate-bounce" />
            <span className="text-xs font-black text-center">
              Perbesar Layar Penuh
            </span>
            <span className="text-[10px] text-red-200 font-medium">
              Untuk Konsumen Scan
            </span>
          </div>

          <button
            type="button"
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-80 group-hover:opacity-100 transition-opacity"
            title="Perbesar Layar Penuh"
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Dynamic vs Static Helper Info */}
        {isBelowMinAmount && (
          <div className="w-full p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Ketentuan Warung Garinul:</strong> Minimal transaksi QRIS adalah <strong>{formatRupiah(MIN_QRIS_AMOUNT)}</strong>.
            </p>
          </div>
        )}

        {qrisMode === 'dynamic' ? (
          <div className="w-full space-y-2">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Nominal Otomatis Terisi:</span>
              </div>
              <span className="font-black font-mono text-emerald-800 text-sm">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Scan via BCA, GoPay, OVO, ShopeePay, Dana, dll.
              </span>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-2">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">Petunjuk Pembayaran:</span>
                <span className="font-bold text-red-600 font-mono">{formatRupiah(totalAmount)}</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pelanggan scan QR code di atas, lalu masukkan nominal <strong>{formatRupiah(totalAmount)}</strong> secara manual di aplikasi perbankan / e-wallet.
              </p>
            </div>
          </div>
        )}

        {/* Copy QRIS String & Fullscreen Action Button */}
        <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold border border-red-200 transition-colors cursor-pointer"
          >
            <Maximize2 size={13} />
            <span>Buka Layar Konsumen</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPayload}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Salin String</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULLSCREEN CUSTOMER-FACING DISPLAY MODAL                                   */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar with Merchant Title & Close */}
          <div className="w-full max-w-lg flex items-center justify-between text-white pb-3 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                  {merchantName}
                </h3>
                <p className="text-xs text-red-300 font-mono">
                  NMID: {nmid} &bull; A01
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Layar Penuh Browser"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-2.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Center Main QR Card for Customer */}
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
            {/* Header Official Red QRIS Brand */}
            <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-red-600 text-white font-black text-sm tracking-widest uppercase shadow-xs">
                  QRIS
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  QR Standar Pembayaran Nasional
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                {qrisMode === 'dynamic' ? 'Nominal Otomatis' : 'Nominal Manual'}
              </span>
            </div>

            {/* Huge QR Code Box */}
            <div className="p-4 sm:p-5 bg-white rounded-3xl border-4 border-slate-900 shadow-xl flex items-center justify-center">
              <QRCodeSVG
                value={currentQRISPayload}
                size={window.innerWidth < 640 ? 240 : 290}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Total Pembayaran Banner */}
            <div className="w-full p-4 bg-slate-900 text-white rounded-2xl shadow-md space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-red-400">
                TOTAL PEMBAYARAN KONSUMEN
              </span>
              <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {formatRupiah(totalAmount)}
              </p>
              {qrisMode === 'dynamic' ? (
                <p className="text-xs text-emerald-400 font-medium">
                  ✓ Nominal sudah otomatis terisi di aplikasi pelanggan
                </p>
              ) : (
                <p className="text-xs text-amber-300 font-medium">
                  *Masukkan nominal {formatRupiah(totalAmount)} secara manual di aplikasi m-banking
                </p>
              )}
            </div>

            {/* Apps Accepted list & Timer */}
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1">
              <span className="flex items-center justify-center gap-1.5 font-medium">
                <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>BCA Mobile, GoPay, OVO, ShopeePay, DANA, Livin, dll.</span>
              </span>

              {qrisMode === 'dynamic' && (
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 self-center">
                  Berlaku: {formatTimer(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Bottom Close Button */}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(false)}
              className="px-6 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20 backdrop-blur-xs flex items-center gap-2"
            >
              <X size={14} />
              <span>Tutup Layar Konsumen (Esc)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRISDisplay;
