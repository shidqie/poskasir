import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { productService } from '@/services/productService';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { Barcode, Sparkles, AlertCircle, Camera } from 'lucide-react';

export function ConvertToProductModal({
  isOpen,
  onClose,
  unregisteredItem,
  onSubmit,
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [error, setError] = useState('');

  // Query Kategori
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
    enabled: isOpen,
  });

  // Query Satuan
  const { data: units = [] } = useQuery({
    queryKey: ['units', 'active'],
    queryFn: () => unitService.getUnits({ onlyActive: true }),
    enabled: isOpen,
  });

  useEffect(() => {
    if (unregisteredItem && isOpen) {
      setName(unregisteredItem.name || '');
      setBarcode(unregisteredItem.barcode || '');
      setSellingPrice(Number(unregisteredItem.selling_price) || 0);
      setCategoryId('');
      setUnitId('');
      setStock(0);
      setMinimumStock(5);
      setError('');

      productService.getNextProductCode().then((nextCode) => {
        setCode(nextCode);
      });
    }
  }, [unregisteredItem, isOpen]);

  const selectedUnit = units.find((u) => u.id === unitId);
  const allowDecimal = Boolean(selectedUnit?.allow_decimal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (!categoryId) {
      setError('Kategori barang wajib dipilih.');
      return;
    }
    if (!unitId) {
      setError('Satuan barang wajib dipilih.');
      return;
    }
    if (Number(sellingPrice) < 0) {
      setError('Harga jual tidak boleh negatif.');
      return;
    }

    try {
      await onSubmit(unregisteredItem.id, {
        name: name.trim(),
        code: code.trim(),
        barcode: barcode.trim() || null,
        category_id: categoryId,
        unit_id: unitId,
        selling_price: Number(sellingPrice) || 0,
        stock: Number(stock) || 0,
        minimum_stock: Number(minimumStock) || 0,
        status: true,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mengonversi menjadi data barang.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Jadikan Data Barang Resmi"
      subtitle="Lengkapi kategori, satuan, dan stok untuk mendaftarkan ke Master Produk"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Nama, harga, dan barcode otomatis terisi dari catatan harga sementara.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              id="conv-name"
              name="name"
              label="Nama Barang"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              disabled={isLoading}
            />
          </div>

          <Input
            id="conv-code"
            name="code"
            label="Kode Barang"
            value={code}
            readOnly
            disabled
          />

          <Input
            id="conv-barcode"
            name="barcode"
            label="Barcode (Opsional)"
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
                className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                title="Scan Barcode via Kamera HP / Webcam"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>Scan</span>
              </button>
            }
          />

          <div>
            <label
              htmlFor="conv-category"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              id="conv-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setError('');
              }}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="conv-unit"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Satuan <span className="text-red-500">*</span>
            </label>
            <select
              id="conv-unit"
              value={unitId}
              onChange={(e) => {
                setUnitId(e.target.value);
                setError('');
              }}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Satuan --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          <CurrencyInput
            id="conv-price"
            name="selling_price"
            label="Harga Jual Satuan"
            required
            value={sellingPrice}
            onChange={(val) => {
              setSellingPrice(val);
              setError('');
            }}
            disabled={isLoading}
          />

          <div>
            <label
              htmlFor="conv-stock"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Stok Awal <span className="text-red-500">*</span>
            </label>
            <input
              id="conv-stock"
              type="number"
              step={allowDecimal ? '0.001' : '1'}
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="conv-min-stock"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Stok Minimum
            </label>
            <input
              id="conv-min-stock"
              type="number"
              step={allowDecimal ? '0.001' : '1'}
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            Jadikan Data Barang Resmi
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

export default ConvertToProductModal;
