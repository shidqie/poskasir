import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/utils/formatters';
import { QrCode, Sparkles, AlertCircle, RefreshCw, CheckCircle, Smartphone } from 'lucide-react';

export function QRISDisplay({ totalAmount, merchantName = 'WARUNG GARINUL, PACET', nmid = 'ID1025414908653' }) {
  const [qrisMode, setQrisMode] = useState('dynamic'); // 'dynamic' | 'static'
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer for dynamic QR

  // Payload data QRIS
  // QRIS Statis default string
  const staticQRISPayload = `00020101021126600016ID.CO.QRIS.WWW01189360091400000000000215${nmid}0303A015204541153033605802ID5921WARUNG GARINUL, PACET6005PACET6304`;
  
  // QRIS Dinamis payload dengan nominal tersemat
  const dynamicQRISPayload = `00020101021226600016ID.CO.QRIS.WWW01189360091400000000000215${nmid}0303A01520454115303360540${String(totalAmount).length}${totalAmount}5802ID5921WARUNG GARINUL, PACET6005PACET6304`;

  // Countdown timer for dynamic QRIS
  useEffect(() => {
    if (qrisMode !== 'dynamic') return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(interval);
  }, [qrisMode]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isBelowMinStatic = totalAmount < 10000;

  return (
    <div className="space-y-3">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
        <button
          type="button"
          onClick={() => {
            setQrisMode('dynamic');
            setTimeLeft(300);
          }}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
        {/* Header QRIS Logo & Merchant Name */}
        <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-extrabold text-slate-900 text-sm tracking-tight">
              {merchantName}
            </h4>
            <p className="text-[11px] font-mono text-slate-500 font-semibold">
              NMID: {nmid} • A01
            </p>
          </div>

          <div className="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-black tracking-wider border border-red-200">
            {qrisMode === 'dynamic' ? 'DINAMIS' : 'STATIS'}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="relative p-3 bg-white rounded-xl border-2 border-slate-900 shadow-xs flex items-center justify-center">
          <QRCodeSVG
            value={qrisMode === 'dynamic' ? dynamicQRISPayload : staticQRISPayload}
            size={180}
            level="M"
            includeMargin={false}
          />
        </div>

        {/* QRIS Mode Details */}
        {qrisMode === 'dynamic' ? (
          <div className="w-full space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Nominal Otomatis Terisi:</span>
              </div>
              <span className="font-extrabold font-mono text-emerald-800 text-sm">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                Scan via BCA, GoPay, OVO, ShopeePay, Dana, dll.
              </span>
              <span className="font-mono font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                {formatTimer(timeLeft)}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Petunjuk Pembayaran:</span>
                <span className="font-bold text-red-600">Minimal Rp10.000</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pelanggan scan QR code di atas, lalu <strong>ketik nominal manual: {formatRupiah(totalAmount)}</strong> di aplikasi e-wallet / m-banking mereka.
              </p>
            </div>

            {isBelowMinStatic && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[11px] flex items-start gap-1.5 text-left">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span>
                  Total belanja di bawah Rp10.000. Disarankan gunakan <strong>QRIS Dinamis</strong> atau <strong>Tunai</strong>.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default QRISDisplay;
