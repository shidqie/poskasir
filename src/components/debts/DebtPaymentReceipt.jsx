import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';
import { formatRupiah, formatTanggalWaktu } from '@/utils/formatters';
import { Button } from '@/components/common/Button';

export function DebtPaymentReceipt({ paymentResult, onClose }) {
  if (!paymentResult) return null;

  const handlePrint = () => {
    window.print();
  };

  const {
    customer_name,
    amount_paid,
    payment_method,
    previous_debt,
    remaining_debt,
    is_fully_paid,
  } = paymentResult;

  return (
    <div className="space-y-4">
      {/* Printable Receipt Card */}
      <div
        id="debt-payment-receipt"
        className="p-5 bg-white border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 space-y-3 shadow-xs"
      >
        {/* Header Toko */}
        <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
          <img src="/logo.png" alt="Logo" className="w-9 h-9 mx-auto mb-1 object-contain" />
          <h3 className="font-extrabold text-sm text-slate-900 tracking-wider">
            WARUNG GARINUL
          </h3>
          <p className="text-[10px] text-slate-500 font-sans">
            Jl. Raya Pacet No. 12, Mojokerto
          </p>
          <p className="text-[10px] text-slate-500 font-sans">
            Telp: 0812-3456-7890
          </p>
          <div className="pt-1">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
              BUKTI PEMBAYARAN HUTANG
            </span>
          </div>
        </div>

        {/* Info Pelanggan & Waktu */}
        <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Waktu:</span>
            <span>{formatTanggalWaktu(new Date().toISOString())}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pelanggan:</span>
            <span className="font-bold text-slate-900">{customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Metode:</span>
            <span className="font-bold uppercase">
              {payment_method === 'cash' ? 'Tunai' : payment_method === 'qris' ? 'QRIS' : 'Transfer'}
            </span>
          </div>
        </div>

        {/* Ringkasan Keuangan */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Hutang Sebelumnya:</span>
            <span>{formatRupiah(previous_debt)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-100">
            <span>Jumlah Dibayar:</span>
            <span className="font-mono text-sm">
              - {formatRupiah(amount_paid)}
            </span>
          </div>
          <div className="flex justify-between font-black text-slate-900 pt-1.5 border-t border-dashed border-slate-300 text-sm">
            <span>Sisa Hutang:</span>
            <span className="font-mono text-red-600">
              {formatRupiah(remaining_debt)}
            </span>
          </div>
        </div>

        {/* Status Pelunasan */}
        <div className="pt-2 text-center border-t border-dashed border-slate-300">
          {is_fully_paid ? (
            <p className="font-extrabold text-emerald-600 text-xs">
              *** HUTANG LUNAS ***
            </p>
          ) : (
            <p className="font-bold text-slate-600 text-[10px]">
              Terima kasih atas pembayaran Anda.
            </p>
          )}
          <p className="text-[9px] text-slate-400 font-sans mt-1">
            Simpan bukti ini sebagai tanda pembayaran sah.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="md" onClick={onClose}>
          Tutup
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={Printer}
          onClick={handlePrint}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          Cetak Struk
        </Button>
      </div>
    </div>
  );
}

export default DebtPaymentReceipt;
