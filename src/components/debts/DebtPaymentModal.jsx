import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { debtService } from '@/services/debtService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { DebtPaymentReceipt } from './DebtPaymentReceipt';
import { QRISDisplay } from '@/components/pos/QRISDisplay';
import { formatRupiah } from '@/utils/formatters';
import {
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowRight,
  User,
  RotateCcw,
} from 'lucide-react';

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000];

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

export function DebtPaymentModal({
  isOpen,
  onClose,
  customer, // { id, name, remainingDebt, phone }
  cashierSessionId = null,
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const [amountInput, setAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'qris'
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const remainingDebt = customer?.remainingDebt || 0;
  const numericAmount = parseRaw(amountInput);
  const isOverpayment = numericAmount > remainingDebt;

  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setPaymentMethod('cash');
      setNotes('');
      setErrorMsg('');
      setPaymentResult(null);
    }
  }, [isOpen, customer]);

  const payMutation = useMutation({
    mutationFn: () => {
      if (!numericAmount || numericAmount <= 0) {
        throw new Error('Nominal pembayaran harus lebih dari Rp 0.');
      }
      if (numericAmount > remainingDebt) {
        throw new Error(
          `Nominal pembayaran (${formatRupiah(numericAmount)}) melebihi sisa hutang (${formatRupiah(remainingDebt)}).`
        );
      }

      return debtService.payCustomerDebt({
        customer_id: customer.id,
        amount: numericAmount,
        payment_method: paymentMethod,
        cashier_session_id: cashierSessionId,
        notes,
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['customer-debt-summary'] });
      queryClient.invalidateQueries({ queryKey: ['customer-debt-txs'] });
      queryClient.invalidateQueries({ queryKey: ['customer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['debt-global-summary'] });
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] });

      setPaymentResult(res);
      if (onSuccess) onSuccess(res);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal memproses pembayaran hutang.');
    },
  });

  const handlePayFull = () => {
    setAmountInput(String(remainingDebt));
    setErrorMsg('');
  };

  const handleQuickAmount = (val) => {
    if (val > remainingDebt) {
      setAmountInput(String(remainingDebt));
    } else {
      setAmountInput(String(val));
    }
    setErrorMsg('');
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountInput(raw);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOverpayment) {
      setErrorMsg(`Nominal pembayaran melebihi sisa hutang (${formatRupiah(remainingDebt)}).`);
      return;
    }
    payMutation.mutate();
  };

  if (paymentResult) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pembayaran Berhasil Dicatat</h3>
              <p className="text-xs text-slate-400 font-normal">Sisa hutang telah diperbarui secara otomatis</p>
            </div>
          </div>
        }
        size="md"
      >
        <DebtPaymentReceipt paymentResult={paymentResult} onClose={onClose} />
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-50 text-red-600">
            <Coins size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Pembayaran Hutang Pelanggan</h3>
            <p className="text-xs text-slate-400 font-normal">
              Catat cicilan atau pelunasan hutang (FIFO)
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Pelanggan & Sisa Hutang */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Pelanggan:</span>
            <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
              <User size={13} className="text-slate-400" />
              {customer?.name}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
            <span className="text-slate-500 font-medium">Total Sisa Hutang:</span>
            <span className="font-black text-rose-600 font-mono text-base">
              {formatRupiah(remainingDebt)}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Pilihan Metode Pembayaran */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Banknote size={16} className={paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'} />
              <span>Tunai (Kas Laci)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                paymentMethod === 'qris'
                  ? 'bg-red-50 border-red-500 text-red-800 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode size={16} className={paymentMethod === 'qris' ? 'text-red-600' : 'text-slate-400'} />
              <span>QRIS (Digital)</span>
            </button>
          </div>
        </div>

        {/* Input Nominal Pembayaran */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-slate-700">
              Nominal Pembayaran <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handlePayFull}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
            >
              Bayar Lunas ({formatRupiah(remainingDebt)})
            </button>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              Rp
            </span>
            <input
              type="text"
              required
              value={amountInput ? formatRupiah(numericAmount).replace('Rp ', '') : ''}
              onChange={handleAmountChange}
              placeholder="0"
              className={`w-full pl-10 pr-3 py-2.5 text-base sm:text-lg font-black font-mono rounded-xl focus:outline-none focus:ring-2 bg-slate-50 border ${
                isOverpayment
                  ? 'border-red-500 text-red-600 focus:ring-red-500'
                  : 'border-slate-200 text-slate-900 focus:ring-red-500 focus:bg-white'
              }`}
            />
          </div>

          {isOverpayment && (
            <p className="text-[11px] font-semibold text-red-600 mt-1">
              * Nominal pembayaran melebihi sisa hutang pelanggan.
            </p>
          )}

          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_AMOUNTS.filter((amt) => amt <= remainingDebt).map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleQuickAmount(amt)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                {formatRupiah(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Tampilan QRIS jika metode QRIS */}
        {paymentMethod === 'qris' && numericAmount > 0 && !isOverpayment && (
          <div className="pt-2">
            <QRISDisplay totalAmount={numericAmount} />
          </div>
        )}

        {/* Catatan / Keterangan */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Catatan <span className="text-slate-400 font-normal">(Opsional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan pembayaran hutang..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
          />
        </div>

        {/* Rincian Sisa Setelah Bayar */}
        {numericAmount > 0 && !isOverpayment && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-center justify-between font-medium text-emerald-900">
            <span>Sisa Hutang Setelah Pembayaran:</span>
            <span className="font-black font-mono text-sm">
              {formatRupiah(Math.max(0, remainingDebt - numericAmount))}
              {remainingDebt - numericAmount === 0 ? ' (LUNAS)' : ''}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={payMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={ArrowRight}
            loading={payMutation.isPending}
            disabled={!numericAmount || isOverpayment}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            Simpan Pembayaran
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default DebtPaymentModal;
