import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { Barcode, HelpCircle, Camera } from 'lucide-react';

export function UnregisteredPriceModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [barcode, setBarcode] = useState('');
  const [unitName, setUnitName] = useState('');
  const [notes, setNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPrice(Number(initialData.selling_price) || 0);
      setBarcode(initialData.barcode || '');
      setUnitName(initialData.unit_name || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setPrice(0);
      setBarcode('');
      setUnitName('');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (Number(price) < 0) {
      setError('Harga jual tidak boleh bernilai negatif.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        selling_price: Number(price) || 0,
        barcode: barcode.trim() || null,
        unit_name: unitName.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan harga barang sementara.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Harga Barang Belum Terdaftar"
      subtitle="Catat harga barang sementara agar tidak perlu menanyakan kembali pada transaksi berikutnya"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Data ini akan langsung dapat ditemukan pada <strong>Daftar Harga</strong> dan nantinya dapat dikonversi menjadi Data Barang resmi oleh Pemilik.
          </p>
        </div>

        {/* Nama Barang */}
        <Input
          id="unreg-name"
          name="name"
          label="Nama Barang"
          placeholder="Contoh: Korek Api Gas, Plastik Sampah..."
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          disabled={isLoading}
        />

        {/* Harga Jual */}
        <CurrencyInput
          id="unreg-price"
          name="price"
          label="Harga Jual"
          required
          value={price}
          onChange={(val) => {
            setPrice(val);
            setError('');
          }}
          disabled={isLoading}
        />

        {/* Barcode (Opsional) */}
        <Input
          id="unreg-barcode"
          name="barcode"
          label="Barcode Bawaan (Opsional)"
          placeholder="Contoh: 8991234567890 (Jika ada barcode di produk)"
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            setError('');
          }}
          icon={Barcode}
          disabled={isLoading}
          rightElement={
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              disabled={isLoading}
              className="px-2 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
              title="Scan Barcode via Kamera HP / Webcam"
            >
              <Camera className="w-3.5 h-3.5 text-red-600" />
              <span>Scan</span>
            </button>
          }
        />

        {/* Satuan Sederhana */}
        <Input
          id="unreg-unit"
          name="unit_name"
          label="Satuan Barang (Opsional)"
          placeholder="Contoh: Pcs, Bungkus, Botol..."
          value={unitName}
          onChange={(e) => {
            setUnitName(e.target.value);
            setError('');
          }}
          disabled={isLoading}
        />

        {/* Catatan */}
        <div>
          <label
            htmlFor="unreg-notes"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            id="unreg-notes"
            rows="2"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
            placeholder="Keterangan ukuran, varian, atau harga beli jika ada..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-medium"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Simpan Harga Barang
          </Button>
        </div>
      </form>

      {/* Modal Scanner Barcode Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          setBarcode(scannedCode);
          setError('');
          setIsScannerOpen(false);
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />
    </Modal>
  );
}

export default UnregisteredPriceModal;
