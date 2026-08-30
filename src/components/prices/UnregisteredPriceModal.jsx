import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { Alert } from '@/components/common/Alert';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { Barcode, HelpCircle, Camera, Check } from 'lucide-react';

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
      setPrice(Number(initialData.price || initialData.selling_price) || 0);
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
    if (Number(price) <= 0) {
      setError('Harga jual harus lebih besar dari Rp0.');
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        selling_price: Number(price),
        barcode: barcode.trim() || null,
        unit_name: unitName.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan harga barang.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title="Tambah Harga Barang Belum Terdaftar"
      subtitle="Catat harga barang sementara agar tersimpan dan langsung dapat dicari di sistem"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="danger" title="Terjadi Kesalahan">
            {error}
          </Alert>
        )}

        {/* Info Notice Box */}
        <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            Data ini akan langsung dapat ditemukan pada <strong>Daftar & Cek Harga</strong> dan nantinya dapat dikonversi menjadi Data Barang resmi oleh Pemilik.
          </p>
        </div>

        {/* 1. Nama Barang */}
        <Input
          id="unreg-name"
          name="name"
          label="Nama Barang"
          placeholder="Contoh: Korek Api Gas, Plastik Sampah, Kerupuk..."
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          disabled={isLoading}
        />

        {/* 2. Grid 2 Kolom: Harga Jual & Satuan Barang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyInput
            id="unreg-price"
            name="price"
            label="Harga Jual (Rp)"
            required
            value={price}
            onChange={(val) => {
              setPrice(val);
              setError('');
            }}
            disabled={isLoading}
          />

          <Input
            id="unreg-unit"
            name="unit_name"
            label="Satuan (Opsional)"
            placeholder="Pcs, Bks, Botol, Kg..."
            value={unitName}
            onChange={(e) => {
              setUnitName(e.target.value);
              setError('');
            }}
            disabled={isLoading}
          />
        </div>

        {/* 3. Barcode Bawaan dengan Tombol Scan Kamera */}
        <Input
          id="unreg-barcode"
          name="barcode"
          label="Barcode Kemasan (Opsional)"
          placeholder="Scan atau ketik kode barcode kemasan..."
          value={barcode}
          onChange={(e) => {
            setBarcode(e.target.value);
            setError('');
          }}
          icon={Barcode}
          disabled={isLoading}
          inputClassName="font-mono pr-24"
          rightElement={
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
              title="Scan Barcode via Kamera HP / Webcam"
            >
              <Camera className="w-3.5 h-3.5 text-red-600" />
              <span>Scan</span>
            </button>
          }
        />

        {/* 4. Catatan Textarea */}
        <Textarea
          id="unreg-notes"
          label="Catatan Tambahan (Opsional)"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isLoading}
          placeholder="Keterangan ukuran, varian rasa, harga beli kulakan, dll..."
        />

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-5 py-2.5 font-bold text-xs"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            icon={Check}
            className="rounded-xl px-5 py-2.5 font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25"
          >
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
