import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatRupiah } from '@/utils/formatters';
import { ShoppingBag, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function CheckoutPlaceholderModal({
  isOpen,
  onClose,
  totalAmount = 0,
  totalQuantity = 0,
  itemsCount = 0,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ringkasan Belanja Kasir"
      subtitle="Verifikasi daftar belanja sebelum melanjutkan ke tahap pembayaran"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-center">
        {/* Total Price Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            Total Tagihan Belanja
          </p>
          <p className="text-3xl font-black mt-1 font-mono">
            {formatRupiah(totalAmount)}
          </p>
          <p className="text-xs text-blue-200 mt-1">
            {itemsCount} Jenis Barang ({totalQuantity} Total Kuantitas)
          </p>
        </div>

        {/* Phase Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-left text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-blue-900 text-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Fase Pengembangan Tahap 3 Selesai</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            Keranjang belanja, kuantitas desimal, pencarian terpadu, validasi stok, dan scanner barcode kamera telah berfungsi dengan stabil.
          </p>
          <div className="pt-2 border-t border-blue-100/80 flex items-center gap-1 text-slate-500">
            <span>Pembayaran & Cetak Struk akan aktif di <strong>Tahap 4</strong>.</span>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          className="w-full justify-center py-2.5 font-bold"
          onClick={onClose}
        >
          Selesai & Tutup
        </Button>
      </div>
    </Modal>
  );
}

export default CheckoutPlaceholderModal;
