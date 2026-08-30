import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { transactionService } from '@/services/transactionService';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { Alert } from '@/components/common/Alert';
import { Button } from '@/components/common/Button';
import { ArrowLeft, Printer, Package, Banknote, QrCode, CreditCard, CheckCircle2, BookOpen, User } from 'lucide-react';

const METHOD_ICONS = { cash: Banknote, qris: QrCode, transfer: CreditCard, debt: BookOpen };
const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', debt: 'Hutang (Bon)' };

function formatDate(dt) {
  return new Date(dt).toLocaleString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function TransactionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trx, isLoading, isError, error } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionService.getTransactionById(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !trx) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Alert variant="danger" title="Transaksi Tidak Ditemukan">
          {error?.message || 'Nomor transaksi tidak valid atau telah dihapus.'}
        </Alert>
        <Button variant="outline" onClick={() => navigate('/transactions')}>
          Kembali ke Riwayat Transaksi
        </Button>
      </div>
    );
  }

  const MethodIcon = METHOD_ICONS[trx.payment_method] || Banknote;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-4">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Riwayat Transaksi', to: '/transactions' },
          { label: trx.transaction_number },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm font-bold cursor-pointer">
          <ArrowLeft size={16} />
          Kembali
        </button>
        <Link
          to={`/transactions/${id}/print`}
          target="_blank"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-500/25 active:scale-95"
        >
          <Printer size={15} />
          Cetak Struk
        </Link>
      </div>

      <div className="space-y-4">
        {/* Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">{trx.transaction_number}</h2>
              <p className="text-xs text-slate-400">{formatDate(trx.transaction_date || trx.created_at)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400">Kasir:</span>
              <p className="font-bold text-slate-800 mt-0.5">{trx.cashier?.full_name || 'Kasir'}</p>
            </div>
            <div>
              <span className="text-slate-400">Metode Bayar:</span>
              <div className="flex items-center gap-1 font-bold text-slate-800 mt-0.5">
                <MethodIcon size={13} className="text-red-600" />
                {METHOD_LABELS[trx.payment_method] || trx.payment_method}
              </div>
            </div>
            {trx.customer && (
              <div>
                <span className="text-slate-400">Pelanggan:</span>
                <p className="font-bold text-amber-900 mt-0.5 flex items-center gap-1">
                  <User size={12} className="text-amber-700" />
                  {trx.customer.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Item List */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-slate-400" />
            <h3 className="font-bold text-slate-900 text-sm">Daftar Barang ({trx.items?.length || 0})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {trx.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div className="min-w-0 flex-1 mr-3">
                  <p className="font-bold text-slate-800 truncate">{item.product_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {Number(item.quantity)} {item.unit_symbol || 'pcs'} × Rp{Number(item.unit_price).toLocaleString('id-ID')}
                  </p>
                </div>
                <p className="font-black text-slate-900 shrink-0">
                  Rp{Number(item.subtotal).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Total Kuantitas</span>
              <span className="font-bold text-slate-800">{Number(trx.total_quantity)} item</span>
            </div>
            <div className="flex justify-between font-black text-base pt-1">
              <span className="text-slate-900">Total Belanja</span>
              <span className="text-red-600">Rp{Number(trx.total_amount).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Dibayar</span>
              <span className="font-bold text-slate-800">Rp{Number(trx.payment_amount).toLocaleString('id-ID')}</span>
            </div>
            {Number(trx.change_amount) > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs font-bold">
                <span>Kembalian</span>
                <span>Rp{Number(trx.change_amount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
