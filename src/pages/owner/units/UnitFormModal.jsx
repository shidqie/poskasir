import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';

export function UnitFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [allowDecimal, setAllowDecimal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSymbol(initialData.symbol || '');
      setAllowDecimal(Boolean(initialData.allow_decimal));
    } else {
      setName('');
      setSymbol('');
      setAllowDecimal(false);
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama satuan wajib diisi.');
      return;
    }
    if (!symbol.trim()) {
      setError('Simbol satuan wajib diisi.');
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        symbol: symbol.trim(),
        allow_decimal: allowDecimal,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan satuan.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Ubah Satuan Barang' : 'Tambah Satuan Barang'}
      subtitle="Satuan digunakan untuk menentukan takaran dan kuantitas produk"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        <Input
          id="unit-name"
          name="name"
          label="Nama Satuan"
          placeholder="Contoh: Kilogram, Pieces, Bungkus..."
          required
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          disabled={isLoading}
        />

        <Input
          id="unit-symbol"
          name="symbol"
          label="Simbol / Singkatan"
          placeholder="Contoh: Kg, Pcs, Bks, Ltr..."
          required
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value);
            setError('');
          }}
          disabled={isLoading}
          helperText="Simbol akan ditampilkan pada daftar harga, nota, dan keranjang"
        />

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allowDecimal}
              onChange={(e) => setAllowDecimal(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Boleh Menggunakan Kuantitas Desimal / Pecahan
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Centang untuk barang yang dijual timbangan/curah (seperti 0.5 Kg, 1.25 Liter, 250 Gram). Jangan dicentang untuk barang utuh seperti Pcs/Bungkus.
              </p>
            </div>
          </label>
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
            {initialData ? 'Simpan Perubahan' : 'Tambah Satuan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default UnitFormModal;
