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
        <div className="p-5 rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-rose-800 text-white shadow-lg shadow-red-500/25 border border-red-500/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-100">
            Total Tagihan Belanja
          </p>
          <p className="text-3xl font-black mt-1 font-mono">
            {formatRupiah(totalAmount)}
          </p>
          <p className="text-xs text-red-200 mt-1 font-semibold">
            {itemsCount} Jenis Barang ({totalQuantity} Total Kuantitas)
          </p>
        </div>

        {/* Phase Notice */}
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-left text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-red-900 text-sm">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Terminal Kasir Siap Digunakan</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            Keranjang belanja, kuantitas desimal, pencarian terpadu, validasi stok, dan scanner barcode kamera telah berfungsi dengan stabil.
          </p>
          <div className="pt-2 border-t border-red-100/80 flex items-center gap-1 text-slate-500">
            <span>Pembayaran & Cetak Struk telah aktif.</span>
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
