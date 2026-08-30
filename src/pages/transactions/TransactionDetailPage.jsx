import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';
import { ArrowLeft, Printer, Package, Banknote, QrCode, CreditCard, CheckCircle2 } from 'lucide-react';

const METHOD_ICONS = { cash: Banknote, qris: QrCode, transfer: CreditCard };
const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer' };

function formatDate(dt) {
  return new Date(dt).toLocaleString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trx, isLoading, isError } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !trx) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <p className="text-red-500 text-sm">Transaksi tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 text-sm">← Kembali</button>
      </div>
    );
  }

  const MethodIcon = METHOD_ICONS[trx.payment_method] || Banknote;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft size={16} />
            Kembali
          </button>
          <Link
            to={`/transactions/${id}/print`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer size={14} />
            Cetak Struk
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 space-y-4">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={28} className="shrink-0" />
            <div>
              <h1 className="font-bold text-lg leading-tight">{trx.transaction_number}</h1>
              <p className="text-green-100 text-sm mt-0.5">{formatDate(trx.transaction_date)}</p>
            </div>
          </div>
        </div>

        {/* Info Transaksi */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Kasir</span>
            <span className="font-semibold text-gray-800">{trx.cashier?.full_name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Metode Bayar</span>
            <span className="flex items-center gap-1.5 font-semibold text-gray-800">
              <MethodIcon size={14} className="text-blue-600" />
              {METHOD_LABELS[trx.payment_method] || trx.payment_method}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase">
              {trx.status}
            </span>
          </div>
        </div>

        {/* Daftar Item */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Package size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              {trx.transaction_items?.length || 0} Item Dibeli
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {trx.transaction_items?.map((item) => (
              <div key={item.id} className="px-4 py-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.item_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {Number(item.quantity)} {item.unit_name} × Rp{Number(item.price).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 shrink-0">
                    Rp{Number(item.subtotal).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({trx.total_quantity} item)</span>
            <span className="font-semibold">Rp{Number(trx.subtotal).toLocaleString('id-ID')}</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between">
            <span className="font-semibold text-gray-800">Total</span>
            <span className="text-lg font-black text-gray-900">Rp{Number(trx.total_amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Dibayar</span>
            <span className="font-semibold">Rp{Number(trx.payment_amount).toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-semibold">Kembalian</span>
            <span className="font-bold text-green-600">Rp{Number(trx.change_amount).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
