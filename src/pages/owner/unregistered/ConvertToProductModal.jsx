import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { productService } from '@/services/productService';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Alert } from '@/components/common/Alert';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { Barcode, Sparkles, Camera } from 'lucide-react';

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

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
    enabled: isOpen,
  });

  // Fetch Units
  const { data: units = [] } = useQuery({
    queryKey: ['units', 'active'],
    queryFn: () => unitService.getUnits({ onlyActive: true }),
    enabled: isOpen,
  });

  // Fetch next product code
  useEffect(() => {
    if (isOpen) {
      productService.getNextProductCode().then((nextCode) => {
        setCode(nextCode);
      });
    }
  }, [isOpen]);

  // Pre-fill data dari item belum terdaftar
  useEffect(() => {
    if (unregisteredItem && isOpen) {
      setName(unregisteredItem.name || '');
      setBarcode(unregisteredItem.barcode || '');
      setSellingPrice(Number(unregisteredItem.price) || 0);
      setStock(0);
      setMinimumStock(5);
      setError('');
    }
  }, [unregisteredItem, isOpen]);

  // Handle unit allow decimal
  const selectedUnit = units.find((u) => u.id === unitId);
  const allowDecimal = Boolean(selectedUnit?.allow_decimal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama barang wajib diisi.');
      return;
    }
    if (!categoryId) {
      setError('Silakan pilih kategori barang.');
      return;
    }
    if (!unitId) {
      setError('Silakan pilih satuan barang.');
      return;
    }
    if (Number(sellingPrice) <= 0) {
      setError('Harga jual harus lebih besar dari 0.');
      return;
    }

    try {
      await onSubmit({
        unregistered_id: unregisteredItem?.id,
        name: name.trim(),
        code: code,
        barcode: barcode.trim() || null,
        category_id: categoryId,
        unit_id: unitId,
        selling_price: Number(sellingPrice),
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
          <Alert variant="danger" title="Terjadi Kesalahan">
            {error}
          </Alert>
        )}

        <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 text-xs text-red-900">
          <Sparkles className="w-4 h-4 text-red-600 shrink-0" />
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
                className="px-2 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                title="Scan Barcode via Kamera HP / Webcam"
              >
                <Camera className="w-3.5 h-3.5 text-red-600" />
                <span>Scan</span>
              </button>
            }
          />

          {/* Kategori Select */}
          <Select
            id="conv-category"
            label="Kategori"
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setError('');
            }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="-- Pilih Kategori --"
            disabled={isLoading}
          />

          {/* Satuan Select */}
          <Select
            id="conv-unit"
            label="Satuan"
            required
            value={unitId}
            onChange={(e) => {
              setUnitId(e.target.value);
              setError('');
            }}
            options={units.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.symbol})`,
            }))}
            placeholder="-- Pilih Satuan --"
            disabled={isLoading}
          />

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
              className="block text-sm font-semibold text-slate-700 mb-1.5"
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
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
            />
          </div>

          <div>
            <label
              htmlFor="conv-min-stock"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Peringatan Stok Minimum
            </label>
            <input
              id="conv-min-stock"
              type="number"
              step={allowDecimal ? '0.001' : '1'}
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
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
