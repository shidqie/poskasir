import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { variantService } from '@/services/variantService';
import { unitService } from '@/services/unitService';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { Alert } from '@/components/common/Alert';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { SaleUnitTable } from '@/components/sale-units/SaleUnitTable';
import { Save, Barcode, Camera, Layers } from 'lucide-react';

export function EditVariantModal({
  isOpen,
  onClose,
  productId,
  variant, // null if creating new variant
  onSuccess,
}) {
  const isEdit = Boolean(variant?.id);
  const queryClient = useQueryClient();

  const [variantName, setVariantName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Query Satuan
  const { data: units = [] } = useQuery({
    queryKey: ['units', 'active'],
    queryFn: () => unitService.getUnits({ onlyActive: true }),
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      if (variant) {
        setVariantName(variant.variant_name || '');
        setCode(variant.code || '');
        setBarcode(variant.barcode || '');
        setSellingPrice(Number(variant.selling_price) || 0);
        setStock(Number(variant.stock) || 0);
        setMinimumStock(Number(variant.minimum_stock) || 0);
        setUnitId(variant.unit_id || variant.unit?.id || '');
        setStatus(variant.status !== undefined ? Boolean(variant.status) : true);
      } else {
        setVariantName('');
        setBarcode('');
        setSellingPrice(0);
        setStock(0);
        setMinimumStock(5);
        setUnitId(units[0]?.id || '');
        setStatus(true);
        variantService.getNextVariantCode().then((nextCode) => setCode(nextCode));
      }
    }
  }, [isOpen, variant, units]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        return variantService.updateVariant(variant.id, data);
      }
      return variantService.createVariant(data);
    },
    onSuccess: (savedData) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      if (onSuccess) onSuccess(savedData);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menyimpan varian produk.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!variantName.trim()) {
      setErrorMsg('Nama varian wajib diisi.');
      return;
    }
    if (Number(sellingPrice) < 0) {
      setErrorMsg('Harga jual tidak boleh bernilai negatif.');
      return;
    }

    const payload = {
      product_id: productId,
      variant_name: variantName.trim(),
      code: code.trim(),
      barcode: barcode.trim() || null,
      selling_price: Number(sellingPrice) || 0,
      minimum_stock: Number(minimumStock) || 0,
      unit_id: unitId || null,
      status,
    };

    if (!isEdit) {
      payload.stock = Number(stock) || 0;
    }

    saveMutation.mutate(payload);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Ubah Varian Produk' : 'Tambah Varian Baru'}
        subtitle={
          isEdit
            ? `Memperbarui rincian varian: ${variant?.variant_name || ''}`
            : 'Tambahkan varian baru untuk produk ini'
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <Alert variant="danger" title="Kesalahan Validasi">
              {errorMsg}
            </Alert>
          )}

          {/* Nama Varian */}
          <Input
            id="variant-name"
            label="Nama Varian"
            placeholder="Contoh: Goreng Original, Rendang, 600 ml..."
            required
            value={variantName}
            onChange={(e) => {
              setVariantName(e.target.value);
              setErrorMsg('');
            }}
            disabled={saveMutation.isPending}
          />

          {/* Kode Varian */}
          <Input
            id="variant-code"
            label="Kode Varian"
            value={code}
            readOnly
            disabled
            helperText="Kode internal varian dibuat otomatis"
          />

          {/* Barcode Varian */}
          <Input
            id="variant-barcode"
            label="Barcode Varian (Opsional)"
            placeholder="Scan atau ketik barcode kemasan..."
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              setErrorMsg('');
            }}
            icon={Barcode}
            disabled={saveMutation.isPending}
            rightElement={
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-red-600" />
                <span>Scan</span>
              </button>
            }
          />

          {/* Harga Jual */}
          <CurrencyInput
            id="variant-selling-price"
            label="Harga Jual Satuan"
            required
            value={sellingPrice}
            onChange={(val) => {
              setSellingPrice(val);
              setErrorMsg('');
            }}
            disabled={saveMutation.isPending}
            helperText={
              isEdit
                ? 'Perubahan harga otomatis dicatat di riwayat harga varian'
                : 'Harga jual untuk varian ini'
            }
          />

          {/* Stok Awal (Hanya saat tambah baru) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Stok Awal
              </label>
              <input
                type="number"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={saveMutation.isPending}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-bold font-mono"
              />
            </div>
          )}

          {/* Stok Minimum */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Peringatan Stok Minimum
            </label>
            <input
              type="number"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              disabled={saveMutation.isPending}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 font-bold font-mono"
            />
          </div>

          {/* Satuan Khusus Varian */}
          <Select
            id="variant-unit"
            label="Satuan Varian"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.symbol})` }))}
            placeholder="-- Ikuti Satuan Produk Utama --"
            disabled={saveMutation.isPending}
          />

          {/* Status */}
          <div className="pt-2 border-t border-slate-100">
            <ToggleSwitch
              label="Status Varian Aktif"
              description="Varian aktif dapat dipilih di POS kasir"
              checked={status}
              onChange={setStatus}
              disabled={saveMutation.isPending}
            />
          </div>

          {/* Pilihan Satuan & Harga Penjualan Khusus Varian */}
          {isEdit && variant?.id && (
            <div className="pt-3 border-t border-slate-200/80">
              <SaleUnitTable
                productId={variant.product_id || productId}
                variantId={variant.id}
                baseUnitSymbol={units.find((u) => u.id === unitId)?.symbol || variant.unit?.symbol || 'Pcs'}
                basePrice={sellingPrice}
                productName={variantName}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saveMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={saveMutation.isPending}
            >
              {isEdit ? 'Simpan Perubahan' : 'Tambah Varian'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scanned) => {
          setBarcode(scanned);
          setIsScannerOpen(false);
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />
    </>
  );
}

export default EditVariantModal;
