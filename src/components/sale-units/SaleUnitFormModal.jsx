import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { saleUnitService } from '@/services/saleUnitService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import {
  Scale,
  Save,
  Barcode,
  Camera,
  AlertCircle,
  CheckCircle2,
  Star,
  Zap,
} from 'lucide-react';

const COMMON_PRESETS = [
  { name: 'Pcs / Eceran', conv: 1 },
  { name: 'Renceng', conv: 10 },
  { name: 'Setengah Dus (1/2 Dus)', conv: 20 },
  { name: '1 Dus', conv: 40 },
  { name: '1/4 Bungkus', conv: 0.25 },
  { name: '1/2 Bungkus', conv: 0.5 },
  { name: '1 Bungkus / Pack', conv: 1 },
  { name: '1/4 Kg', conv: 0.25 },
  { name: '1/2 Kg', conv: 0.5 },
  { name: '1 Kg', conv: 1 },
];

export function SaleUnitFormModal({
  isOpen,
  onClose,
  productId,
  variantId = null,
  baseUnitSymbol = 'Pcs',
  saleUnit = null,
  onSuccess,
}) {
  const isEdit = Boolean(saleUnit);

  const [name, setName] = useState('');
  const [conversionQty, setConversionQty] = useState('1');
  const [sellingPrice, setSellingPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (saleUnit) {
        setName(saleUnit.name || '');
        setConversionQty(String(saleUnit.conversion_qty || 1));
        setSellingPrice(String(saleUnit.selling_price || ''));
        setBarcode(saleUnit.barcode || '');
        setIsDefault(Boolean(saleUnit.is_default));
        setStatus(saleUnit.status !== false);
        setSortOrder(String(saleUnit.sort_order || 0));
      } else {
        setName('');
        setConversionQty('1');
        setSellingPrice('');
        setBarcode('');
        setIsDefault(false);
        setStatus(true);
        setSortOrder('0');
      }
    }
  }, [isOpen, saleUnit]);

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit) {
        return saleUnitService.updateSaleUnit(saleUnit.id, payload);
      }
      return saleUnitService.createSaleUnit(payload);
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menyimpan satuan penjualan.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Nama satuan penjualan wajib diisi.');
      return;
    }

    const numConv = parseFloat(conversionQty);
    if (isNaN(numConv) || numConv <= 0) {
      setErrorMsg('Jumlah konversi stok harus lebih dari 0.');
      return;
    }

    const numPrice = parseFloat(sellingPrice.replace(/\D/g, ''));
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Harga jual tidak valid.');
      return;
    }

    mutation.mutate({
      product_id: productId,
      variant_id: variantId || null,
      name: name.trim(),
      conversion_qty: numConv,
      selling_price: numPrice,
      barcode: barcode.trim() || null,
      is_default: isDefault,
      status: status,
      sort_order: parseInt(sortOrder, 10) || 0,
    });
  };

  const applyPreset = (preset) => {
    setName(preset.name);
    setConversionQty(String(preset.conv));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Satuan Penjualan' : 'Tambah Satuan Penjualan Baru'}
        subtitle={`Atur harga khusus dan konversi stok ke satuan dasar (${baseUnitSymbol})`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Cepat */}
          {!isEdit && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">
                Pilihan Preset Cepat (Opsional)
              </label>
              <div className="flex flex-wrap gap-1">
                {COMMON_PRESETS.slice(0, 6).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nama Satuan Penjualan */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nama Satuan Penjualan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dus, Setengah Dus, Renceng, 1/4 Bungkus..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          {/* Grid Konversi Stok & Harga Jual */}
          <div className="grid grid-cols-2 gap-3">
            {/* Jumlah Konversi */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Konversi Stok <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={conversionQty}
                  onChange={(e) => setConversionQty(e.target.value)}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono outline-none focus:bg-white focus:border-red-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {baseUnitSymbol}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                1 {name || 'Satuan'} = {conversionQty || 0} {baseUnitSymbol} stok dasar
              </p>
            </div>

            {/* Harga Jual */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Harga Jual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    sellingPrice
                      ? Number(sellingPrice.replace(/\D/g, '')).toLocaleString('id-ID')
                      : ''
                  }
                  onChange={(e) => setSellingPrice(e.target.value.replace(/\D/g, ''))}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-right font-mono text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Barcode Khusus Satuan Ini */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Barcode Khusus Satuan (Opsional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Barcode className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Barcode kemasan kardus / renceng..."
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                icon={Camera}
                onClick={() => setIsScannerOpen(true)}
                className="px-3.5 py-2.5 text-xs font-bold shrink-0 rounded-xl border-slate-200 hover:border-red-500 hover:text-red-600 transition-colors"
              >
                Scan
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Jika diisi, men-scan barcode ini di kasir langsung memilih satuan ini secara otomatis.
            </p>
          </div>

          {/* Toggles: Default & Status */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${isDefault ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                <span className="font-bold text-slate-800">Jadikan Satuan Default</span>
              </div>
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-200/60">
              <span className="font-bold text-slate-800">Status Aktif di Kasir</span>
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
              />
            </label>
          </div>

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="py-2.5 text-xs font-bold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              isLoading={mutation.isPending}
              disabled={mutation.isPending}
              className="py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl cursor-pointer"
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Satuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barcode Camera Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setBarcode(code);
          setIsScannerOpen(false);
        }}
      />
    </>
  );
}

export default SaleUnitFormModal;
