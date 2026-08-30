import React, { useEffect } from 'react';
import { CheckCircle2, Printer, ShoppingCart, Eye, Banknote, QrCode, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '@/utils/formatters';

export default function TransactionSuccessModal({ isOpen, transaction, onNewTransaction }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const isDebt = transaction.payment_method === 'debt';
  const isQris = transaction.payment_method === 'qris';
  const isCash = transaction.payment_method === 'cash' || !transaction.payment_method;

  const handlePrint = () => {
    navigate(`/transactions/${transaction.transaction_id}/print`);
  };

  const handleDetail = () => {
    navigate(`/transactions/${transaction.transaction_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Success Banner */}
        <div
          className={`px-6 py-6 text-center text-white ${
            isDebt
              ? 'bg-gradient-to-br from-amber-600 to-orange-700'
              : 'bg-gradient-to-br from-emerald-600 to-teal-700'
          }`}
        >
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2.5 backdrop-blur-xs">
            {isDebt ? <BookOpen size={30} className="text-white" /> : <CheckCircle2 size={32} className="text-white" />}
          </div>
          <h2 className="text-white font-black text-lg">
            {isDebt ? 'Hutang Berhasil Dicatat!' : 'Transaksi Berhasil!'}
          </h2>
          <p className="text-white/80 text-xs font-mono mt-0.5">
            {transaction.transaction_number}
          </p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Metode Pembayaran</span>
            <span
              className={`font-bold inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md uppercase ${
                isDebt
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {isDebt ? (
                <BookOpen size={13} className="text-amber-700" />
              ) : isQris ? (
                <QrCode size={13} className="text-red-600" />
              ) : (
                <Banknote size={13} className="text-emerald-600" />
              )}
              {isDebt ? 'Hutang (Bon)' : isQris ? 'QRIS' : 'Tunai'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Total Belanja</span>
            <span className="font-bold text-slate-900 text-sm font-mono">
              {formatRupiah(transaction.total_amount)}
            </span>
          </div>

          {isDebt ? (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
              <div className="flex justify-between items-center font-bold text-amber-900">
                <span>Total Hutang Baru:</span>
                <span className="font-mono text-sm">{formatRupiah(transaction.total_amount)}</span>
              </div>
              <p className="text-[10px] text-amber-700">
                Tercatat ke buku piutang pelanggan.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  {isQris ? 'Dibayar (QRIS)' : 'Uang Diterima'}
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatRupiah(transaction.payment_amount)}
                </span>
              </div>

              {isCash && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                  <span className="font-bold text-slate-700">Uang Kembalian</span>
                  <span className="text-base font-black text-emerald-600 font-mono">
                    {formatRupiah(transaction.change_amount)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer size={15} />
              Cetak Struk
            </button>
            <button
              onClick={handleDetail}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Eye size={15} />
              Lihat Detail
            </button>
          </div>
          <button
            onClick={onNewTransaction}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-all shadow-md shadow-red-500/25 active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={15} />
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
