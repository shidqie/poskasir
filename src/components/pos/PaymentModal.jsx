import { useState, useEffect, useCallback, useRef } from 'react';
import { X, CreditCard, Banknote, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

const formatRupiah = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(String(value).replace(/\D/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

const parseRupiah = (value) => {
  const num = Number(String(value).replace(/\D/g, ''));
  return isNaN(num) ? 0 : num;
};

const QUICK_AMOUNTS_BASE = [2000, 5000, 10000, 20000, 50000, 100000];

function buildQuickAmounts(total) {
  const exact = total;
  const suggestions = QUICK_AMOUNTS_BASE.map((v) => Math.ceil(total / v) * v).filter(
    (v) => v >= total && v !== exact
  );
  // Deduplicate + sort + limit 5
  const unique = [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 5);
  return [exact, ...unique];
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', Icon: Banknote },
  { id: 'qris', label: 'QRIS', Icon: QrCode },
  { id: 'transfer', label: 'Transfer', Icon: CreditCard },
];

export default function PaymentModal({ isOpen, onClose, total, onConfirm, isProcessing }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedInput, setReceivedInput] = useState('');
  const inputRef = useRef(null);

  const received = parseRupiah(receivedInput);
  const change = received >= total ? received - total : 0;
  const isShortage = received > 0 && received < total;
  const canPay = received >= total || paymentMethod !== 'cash';
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
    setReceivedInput(raw ? formatRupiah(raw) : '');
  }, []);

  const handleQuickAmount = useCallback((amount) => {
    setReceivedInput(formatRupiah(amount));
  }, []);

  const handleConfirm = useCallback(() => {
    if (!canPay) return;
    const finalReceived = paymentMethod === 'cash' ? received : total;
    onConfirm({ paymentMethod, paymentAmount: finalReceived, changeAmount: finalReceived - total });
  }, [canPay, paymentMethod, received, total, onConfirm]);

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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isProcessing ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-semibold text-lg leading-tight">Pembayaran</h2>
            <p className="text-blue-100 text-sm">
              Total:{' '}
              <span className="font-bold text-white">
                Rp{total.toLocaleString('id-ID')}
              </span>
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* Payment Method */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Metode Bayar
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  disabled={isProcessing}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                    paymentMethod === id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Cash Input */}
          {paymentMethod === 'cash' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Uang Diterima
              </p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">
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
                  className={`w-full pl-9 pr-4 py-3 border-2 rounded-xl text-right text-lg font-semibold outline-none transition-colors ${
                    isShortage
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : received >= total && received > 0
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 focus:border-blue-400'
                  }`}
                />
              </div>

              {/* Quick amounts */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickAmount(amount)}
                    disabled={isProcessing}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      received === amount
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {amount === total ? 'Uang Pas' : `Rp${(amount / 1000).toFixed(0)}rb`}
                  </button>
                ))}
              </div>

              {/* Shortage / Change indicator */}
              {isShortage && received > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-red-600 text-sm font-medium">
                  <AlertCircle size={14} />
                  Kurang Rp{(total - received).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          )}

          {/* Kembalian / Ringkasan */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Belanja</span>
              <span className="font-semibold text-gray-800">
                Rp{total.toLocaleString('id-ID')}
              </span>
            </div>
            {paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Uang Diterima</span>
                  <span className="font-semibold text-gray-800">
                    {received > 0 ? `Rp${received.toLocaleString('id-ID')}` : '—'}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">Kembalian</span>
                  <span
                    className={`text-lg font-bold ${
                      change > 0 ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    Rp{change.toLocaleString('id-ID')}
                  </span>
                </div>
              </>
            )}
            {paymentMethod !== 'cash' && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Metode</span>
                <span className="font-semibold text-blue-600 uppercase">{paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleConfirm}
            disabled={!canPay || isProcessing}
            className={`w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              canPay && !isProcessing
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Bayar Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
