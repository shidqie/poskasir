import { useEffect } from 'react';
import { CheckCircle2, Printer, ShoppingCart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TransactionSuccessModal({ isOpen, transaction, onNewTransaction }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    // Play subtle success sound using Web Audio API
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

  const handlePrint = () => {
    navigate(`/transactions/${transaction.transaction_id}/print`);
  };

  const handleDetail = () => {
    navigate(`/transactions/${transaction.transaction_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Success Banner */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce-once">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl">Transaksi Berhasil!</h2>
          <p className="text-green-100 text-sm mt-1">
            {transaction.transaction_number}
          </p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Belanja</span>
            <span className="font-bold text-gray-800">
              Rp{Number(transaction.total_amount).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Dibayar</span>
            <span className="font-semibold text-gray-800">
              Rp{Number(transaction.payment_amount).toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t pt-3">
            <span className="font-semibold text-gray-700">Kembalian</span>
            <span className="text-lg font-bold text-green-600">
              Rp{Number(transaction.change_amount).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              <Printer size={16} />
              Cetak Struk
            </button>
            <button
              onClick={handleDetail}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-blue-200 text-blue-700 font-medium text-sm hover:bg-blue-50 transition-colors"
            >
              <Eye size={16} />
              Lihat Detail
            </button>
          </div>
          <button
            onClick={onNewTransaction}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            <ShoppingCart size={16} />
            Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
