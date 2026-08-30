import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Barcode, Plus, Search, HelpCircle } from 'lucide-react';

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
      subtitle="Barcode produk belum terdaftar di Master Produk maupun Catatan Harga Sementara"
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
          Anda dapat langsung mencatat nama & harga barang ini agar dapat dimasukkan ke transaksi sekarang.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full justify-center font-bold"
            icon={Plus}
            onClick={() => {
              onClose();
              if (onAddTemporaryPrice) onAddTemporaryPrice(scannedBarcode);
            }}
          >
            Catat Harga Barang Ini
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-center"
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
