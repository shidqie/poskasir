import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/utils/formatters';
import {
  convertStaticToDynamic,
  WARUNG_GARINUL_STATIC_QRIS,
  MIN_QRIS_AMOUNT,
} from '@/utils/qrisHelper';
import {
  QrCode,
  Sparkles,
  Maximize2,
  Minimize2,
  X,
  Copy,
  Check,
  Smartphone,
  Store,
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
  const [customStaticQRIS] = useState(() => {
    return localStorage.getItem('store_custom_static_qris') || '';
  });

  const isBelowMinAmount = Number(totalAmount || 0) < MIN_QRIS_AMOUNT;

  // Generate payload
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
      {/* Mode Switcher Tabs (Minimalist) */}
      <div className="flex p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setQrisMode('dynamic');
            setTimeLeft(300);
          }}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrisMode === 'dynamic'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Otomatis (Dinamis)</span>
        </button>

        <button
          type="button"
          onClick={() => setQrisMode('static')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            qrisMode === 'static'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Statis</span>
        </button>
      </div>

      {/* QRIS Card Display (Minimalist Clean) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-3">
        {/* Header Store Name */}
        <div className="w-full flex items-center justify-between text-left pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-bold text-slate-900 text-xs tracking-tight">
              {merchantName}
            </h4>
            <p className="text-[10px] font-mono text-slate-400">
              NMID: {nmid}
            </p>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            QRIS
          </span>
        </div>

        {/* Minimalist QR Code Box */}
        <div
          onClick={() => setIsCustomerModalOpen(true)}
          className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-400 transition-all cursor-pointer group relative flex items-center justify-center"
          title="Klik untuk membuka layar penuh pelanggan"
        >
          <QRCodeSVG
            value={currentQRISPayload}
            size={180}
            level="M"
            includeMargin={false}
          />
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity flex items-center justify-center">
            <span className="bg-white/90 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1">
              <Maximize2 size={12} />
              Perbesar
            </span>
          </div>
        </div>

        {/* Total Price */}
        <div className="w-full pt-1">
          <p className="text-[11px] text-slate-400 font-medium">Total Tagihan</p>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
            {formatRupiah(totalAmount)}
          </p>
          {qrisMode === 'dynamic' && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Berlaku: <span className="font-mono font-semibold text-slate-600">{formatTimer(timeLeft)}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <Maximize2 size={12} />
            <span>Layar Konsumen</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPayload}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 font-medium transition-colors cursor-pointer text-xs"
          >
            {isCopied ? (
              <>
                <Check size={12} className="text-emerald-600" />
                <span className="text-emerald-600">Tersalin</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MINIMALIST FULLSCREEN CUSTOMER-FACING DISPLAY MODAL                         */}
      {/* ========================================================================= */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
          {/* Main Card (Minimalist Clean Aesthetic) */}
          <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center space-y-5 relative">
            {/* Top Minimalist Controls */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  {merchantName}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  NMID: {nmid}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleBrowserFullscreen}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Layar Penuh"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Tutup (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Pure Clean QR Code Canvas */}
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
              <QRCodeSVG
                value={currentQRISPayload}
                size={window.innerWidth < 640 ? 230 : 270}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Total Pembayaran (Clean Minimalist Focus) */}
            <div className="w-full space-y-1">
              <p className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Total Pembayaran
              </p>
              <p className="text-3xl sm:text-4xl font-black font-mono text-slate-950 tracking-tight">
                {formatRupiah(totalAmount)}
              </p>
              <p className="text-xs text-slate-500 font-medium pt-1">
                {qrisMode === 'dynamic'
                  ? 'Scan untuk bayar (nominal otomatis terisi)'
                  : `Scan lalu masukkan nominal ${formatRupiah(totalAmount)}`}
              </p>
            </div>

            {/* Footer Support Info */}
            <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Smartphone size={14} className="text-slate-400" />
                <span className="text-[11px] font-medium text-slate-500">M-Banking & E-Wallet</span>
              </span>

              {qrisMode === 'dynamic' && (
                <span className="text-[11px] font-mono font-medium text-slate-500">
                  {formatTimer(timeLeft)}
                </span>
              )}
            </div>
          </div>

          {/* Minimalist Close Action Below */}
          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(false)}
            className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-medium transition-colors cursor-pointer backdrop-blur-xs flex items-center gap-1.5"
          >
            <span>Tutup Layar (Esc)</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default QRISDisplay;
