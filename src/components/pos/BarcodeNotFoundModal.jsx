import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Barcode, Send, Search, HelpCircle } from 'lucide-react';

export function BarcodeNotFoundModal({
  isOpen,
  onClose,
  scannedBarcode,
  onAddTemporaryPrice,
  onSearchByName,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Barang Belum Terdaftar"
      subtitle="Barcode produk belum terdaftar di Data Barang resmi toko"
    >
      <div className="space-y-4 text-center">
        {/* Icon & Barcode Box */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 inline-block mx-auto">
          <Barcode className="w-10 h-10 text-amber-600 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500 font-medium">Barcode Terbaca:</p>
          <p className="text-base font-mono font-bold text-slate-900 mt-0.5">
            {scannedBarcode || '-'}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
          Barang belum terdaftar. Anda dapat mengajukan barang baru ini agar dapat direview & disetujui oleh Pemilik.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md"
            icon={Send}
            onClick={() => {
              onClose();
              if (onAddTemporaryPrice) onAddTemporaryPrice(scannedBarcode);
            }}
          >
            Ajukan Barang Baru ke Pemilik
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center rounded-xl"
            icon={Search}
            onClick={() => {
              onClose();
              if (onSearchByName) onSearchByName();
            }}
          >
            Cari Berdasarkan Nama
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-slate-500 text-xs"
            onClick={onClose}
          >
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default BarcodeNotFoundModal;
