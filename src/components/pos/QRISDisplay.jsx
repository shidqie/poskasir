import React, { useState, useEffect, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/utils/formatters';
import { generateEMVCoQRIS, convertStaticToDynamic, crc16 } from '@/utils/qrisHelper';
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
} from 'lucide-react';

export function QRISDisplay({
  totalAmount,
  merchantName = 'WARUNG GARINUL, PACET',
  nmid = 'ID1025414908653',
}) {
  const [qrisMode, setQrisMode] = useState('dynamic'); // 'dynamic' | 'static'
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [isCopied, setIsCopied] = useState(false);
  const [customStaticQRIS, setCustomStaticQRIS] = useState(() => {
    return localStorage.getItem('store_custom_static_qris') || '';
  });
  const [showConfig, setShowConfig] = useState(false);
  const [inputCustomQRIS, setInputCustomQRIS] = useState(customStaticQRIS);

  // Generate payload
  const currentQRISPayload = useMemo(() => {
    if (customStaticQRIS.trim()) {
      // Jika toko punya static QRIS asli dari bank/e-wallet, convert ke dynamic jika mode dynamic
      if (qrisMode === 'dynamic') {
        return convertStaticToDynamic(customStaticQRIS, totalAmount);
      }
      return customStaticQRIS.trim();
    }

    // Default: generate standard valid EMVCo QRIS
    return generateEMVCoQRIS({
      nmid,
      merchantName,
      merchantCity: 'PACET',
      amount: qrisMode === 'dynamic' ? totalAmount : null,
    });
  }, [customStaticQRIS, qrisMode, totalAmount, nmid, merchantName]);

  // Countdown timer for dynamic QRIS
  useEffect(() => {
    if (qrisMode !== 'dynamic') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [qrisMode]);

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
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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

        {/* QR Code Container with Valid EMVCo Standards */}
        <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center">
          <QRCodeSVG
            value={currentQRISPayload}
            size={190}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* Dynamic vs Static Helper Info */}
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

        {/* Copy QRIS String Button for Testing / Verification */}
        <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-mono truncate max-w-[200px]" title={currentQRISPayload}>
            CRC16: {currentQRISPayload.slice(-4)}
          </span>
          <button
            type="button"
            onClick={handleCopyPayload}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check size={11} className="text-emerald-600" />
                <span className="text-emerald-600">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Salin String QRIS</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRISDisplay;
