import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { QRISDisplay } from '@/components/pos/QRISDisplay';
import { formatRupiah } from '@/utils/formatters';

const parseRupiah = (value) => {
  const num = Number(String(value).replace(/\D/g, ''));
  return isNaN(num) ? 0 : num;
};

const QUICK_AMOUNTS_BASE = [10000, 20000, 50000, 100000, 200000];

function buildQuickAmounts(total) {
  const exact = total;
  const suggestions = QUICK_AMOUNTS_BASE.map((v) => Math.ceil(total / v) * v).filter(
    (v) => v >= total && v !== exact
  );
  const unique = [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 5);
  return [exact, ...unique];
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', Icon: Banknote, desc: 'Uang Fisik Laci' },
  { id: 'qris', label: 'QRIS', Icon: QrCode, desc: 'Digital / Non-Tunai' },
];

export default function PaymentModal({ isOpen, onClose, total, onConfirm, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedInput, setReceivedInput] = useState('');
  const inputRef = useRef(null);

  const received = parseRupiah(receivedInput);
  const change = received >= total ? received - total : 0;
  const isShortage = paymentMethod === 'cash' && received > 0 && received < total;
  const canPay = paymentMethod === 'cash' ? received >= total : true;
  const quickAmounts = buildQuickAmounts(total);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('cash');
      setReceivedInput('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleReceivedChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setReceivedInput(raw ? Number(raw).toLocaleString('id-ID') : '');
  }, []);

  const handleQuickAmount = useCallback((amount) => {
    setReceivedInput(Number(amount).toLocaleString('id-ID'));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canPay || isProcessing) return;
    const finalReceived = paymentMethod === 'cash' ? received : total;
    onConfirm({
      paymentMethod,
      paymentAmount: finalReceived,
      changeAmount: finalReceived - total,
    });
  }, [canPay, isProcessing, paymentMethod, received, total, onConfirm]);

  // Keyboard: Enter to confirm, Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === 'Enter' && canPay && !isProcessing) handleConfirm();
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, canPay, isProcessing, handleConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 px-5 py-4 flex items-center justify-between text-white">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-200 block">
              Proses Pembayaran Kasir
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xs text-red-100 font-medium">Total:</span>
              <span className="text-xl font-black font-mono">
                {formatRupiah(total)}
              </span>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={16} className="text-white" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Payment Method Selector (Tunai vs QRIS) */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map(({ id, label, Icon, desc }) => {
                const isSelected = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    disabled={isProcessing}
                    className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-red-600 bg-red-50/70 text-red-900 shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black leading-none">{label}</p>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                        {desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 1. PEMBAYARAN TUNAI (Uang Diterima & Kembalian) */}
          {/* ========================================================================= */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    Rp
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={receivedInput}
                    onChange={handleReceivedChange}
                    disabled={isProcessing}
                    placeholder="0"
                    className={`w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl text-right text-xl font-black outline-none transition-colors font-mono ${
                      isShortage
                        ? 'border-rose-400 bg-rose-50/50 text-rose-700'
                        : received >= total && received > 0
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900'
                        : 'border-slate-200 focus:border-red-500 bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAmount(amount)}
                    disabled={isProcessing}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                      received === amount
                        ? 'bg-red-600 text-white border-red-600 shadow-xs shadow-red-500/25'
                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                    }`}
                  >
                    {amount === total ? 'Uang Pas' : formatRupiah(amount)}
                  </button>
                ))}
              </div>

              {/* Shortage indicator */}
              {isShortage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>Kurang: {formatRupiah(total - received)}</span>
                </div>
              )}

              {/* Kembalian Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Uang Kembalian:
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      change > 0 ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    {formatRupiah(change)}
                  </span>
                </div>
                {received >= total && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                    {change === 0 ? 'Uang Pas' : 'Lunas'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PEMBAYARAN QRIS (Digital, Tanpa Uang Diterima & Tanpa Kembalian) */}
          {/* ========================================================================= */}
          {paymentMethod === 'qris' && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-red-50/60 border border-red-200/90 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-red-500 font-bold uppercase block">
                    Total Tagihan QRIS:
                  </span>
                  <span className="text-xl font-black text-red-700 font-mono">
                    {formatRupiah(total)}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs">
                  Nominal Pas
                </span>
              </div>

              {/* QRIS Display */}
              <QRISDisplay totalAmount={total} />
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canPay || isProcessing}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                canPay && !isProcessing
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Memproses Transaksi...</span>
                </>
              ) : paymentMethod === 'qris' ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Konfirmasi Pembayaran QRIS</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Konfirmasi Pembayaran Tunai</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
