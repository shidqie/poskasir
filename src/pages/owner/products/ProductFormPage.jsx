import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { ArrowLeft, Save, Package, Barcode, Camera, AlertCircle } from 'lucide-react';

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form States
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minimumStock, setMinimumStock] = useState(5);
  const [status, setStatus] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Kategori
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
  });

  // Query Satuan
  const { data: units = [] } = useQuery({
    queryKey: ['units', 'active'],
    queryFn: () => unitService.getUnits({ onlyActive: true }),
  });

  // Query Data Produk jika mode Edit
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProductById(id),
    enabled: isEdit,
  });

  // Populate data untuk edit atau ambil next code otomatis untuk create
  useEffect(() => {
    if (isEdit && productData) {
      setName(productData.name || '');
      setCode(productData.code || '');
      setBarcode(productData.barcode || '');
      setCategoryId(productData.category_id || '');
      setUnitId(productData.unit_id || '');
      setSellingPrice(Number(productData.selling_price) || 0);
      setStock(Number(productData.stock) || 0);
      setMinimumStock(Number(productData.minimum_stock) || 0);
      setStatus(Boolean(productData.status));
    } else if (!isEdit) {
      productService.getNextProductCode().then((nextCode) => {
        setCode(nextCode);
      });
    }
  }, [isEdit, productData]);

  // Cek apakah satuan yang dipilih mengizinkan desimal
  const selectedUnit = units.find((u) => u.id === unitId);
  const allowDecimal = Boolean(selectedUnit?.allow_decimal);

  // Mutation Save
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (isEdit) {
        return productService.updateProduct(id, payload);
      }
      return productService.createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      setToast({
        isOpen: true,
        message: isEdit
          ? 'Data barang berhasil diperbarui.'
          : 'Barang baru berhasil ditambahkan.',
        type: 'success',
      });
      setTimeout(() => {
        navigate('/owner/products');
      }, 1000);
    },
    onError: (err) => {
      setFormError(err.message || 'Gagal menyimpan data barang.');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Nama barang wajib diisi.');
      return;
    }
    if (!categoryId) {
      setFormError('Kategori barang wajib dipilih.');
      return;
    }
    if (!unitId) {
      setFormError('Satuan barang wajib dipilih.');
      return;
    }
    if (Number(sellingPrice) < 0) {
      setFormError('Harga jual tidak boleh bernilai negatif.');
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim(),
      barcode: barcode.trim() || null,
      category_id: categoryId,
      unit_id: unitId,
      selling_price: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      minimum_stock: Number(minimumStock) || 0,
      status,
    };

    saveMutation.mutate(payload);
  };

  if (isEdit && isLoadingProduct) {
    return (
      <div className="p-8 text-center">
        <LoadingSpinner size="lg" message="Memuat data produk..." />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full">
      {/* Header Back Navigation */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/owner/products"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isEdit ? 'Ubah Data Barang' : 'Tambah Barang Baru'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {isEdit
                ? `Mengubah informasi untuk produk ${productData?.name || ''}`
                : 'Lengkapi rincian produk sembako baru'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {formError && (
          <div
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Terjadi Kesalahan</p>
              <p className="text-xs text-red-600 mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        <Card title="Informasi Utama Produk">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Nama Produk */}
            <div className="sm:col-span-2">
              <Input
                id="product-name"
                name="name"
                label="Nama Barang"
                placeholder="Contoh: Indomie Goreng Spesial, Aqua Botol 600ml, Beras Ramos..."
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError('');
                }}
                disabled={saveMutation.isPending}
              />
            </div>

            {/* Kode Barang (Read-only / Auto-generated) */}
            <Input
              id="product-code"
              name="code"
              label="Kode Barang (Otomatis)"
              value={code}
              readOnly
              disabled
              helperText="Kode internal dibuat otomatis oleh sistem"
            />

            {/* Barcode (Opsional) */}
            <Input
              id="product-barcode"
              name="barcode"
              label="Barcode Bawaan Produk (Opsional)"
              placeholder="Contoh: 8996001301057 (Kosongkan jika tidak ada)"
              value={barcode}
              onChange={(e) => {
                setBarcode(e.target.value);
                setFormError('');
              }}
              icon={Barcode}
              disabled={saveMutation.isPending}
              rightElement={
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  disabled={saveMutation.isPending}
                  className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  title="Scan Barcode via Kamera HP / Webcam"
                >
                  <Camera className="w-3.5 h-3.5 text-red-600" />
                  <span>Scan Kamera</span>
                </button>
              }
              helperText="Gunakan tombol Scan Kamera atau ketik manual jika ada barcode di kemasan produk."
            />

            {/* Kategori */}
            <div>
              <label
                htmlFor="product-category"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Kategori <span className="text-red-500">*</span>
              </label>
              <select
                id="product-category"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setFormError('');
                }}
                required
                disabled={saveMutation.isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors font-medium"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Satuan */}
            <div>
              <label
                htmlFor="product-unit"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Satuan <span className="text-red-500">*</span>
              </label>
              <select
                id="product-unit"
                value={unitId}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  setFormError('');
                }}
                required
                disabled={saveMutation.isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors font-medium"
              >
                <option value="">-- Pilih Satuan --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol}) {u.allow_decimal ? '— Pecahan/Kg' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Harga & Persediaan */}
        <Card title="Harga & Persediaan Stok">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Harga Jual */}
            <CurrencyInput
              id="product-price"
              name="selling_price"
              label="Harga Jual Satuan"
              required
              value={sellingPrice}
              onChange={(val) => {
                setSellingPrice(val);
                setFormError('');
              }}
              disabled={saveMutation.isPending}
              helperText="Harga yang berlaku saat transaksi kasir"
            />

            {/* Stok Awal */}
            <div>
              <label
                htmlFor="product-stock"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Jumlah Stok {selectedUnit ? `(${selectedUnit.symbol})` : ''}{' '}
                <span className="text-red-500">*</span>
              </label>
              <input
                id="product-stock"
                type="number"
                step={allowDecimal ? '0.001' : '1'}
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                disabled={saveMutation.isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
              />
              <p className="text-xs text-slate-500 mt-1">
                {allowDecimal
                  ? 'Mendukung pecahan desimal (contoh: 1.5, 2.25)'
                  : 'Harus berupa bilangan bulat (1, 2, 3...)'}
              </p>
            </div>

            {/* Stok Minimum */}
            <div>
              <label
                htmlFor="product-min-stock"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Peringatan Stok Minimum
              </label>
              <input
                id="product-min-stock"
                type="number"
                step={allowDecimal ? '0.001' : '1'}
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(e.target.value)}
                disabled={saveMutation.isPending}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold"
              />
              <p className="text-xs text-slate-500 mt-1">
                Status akan menjadi "Menipis" jika stok mencapai angka ini
              </p>
            </div>
          </div>

          {/* Status Switch */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Status Produk</p>
              <p className="text-xs text-slate-500">
                Produk aktif dapat dicari dan dijual di terminal kasir
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={status}
                onChange={(e) => setStatus(e.target.checked)}
                disabled={saveMutation.isPending}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/owner/products')}
            disabled={saveMutation.isPending}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            isLoading={saveMutation.isPending}
          >
            {isEdit ? 'Simpan Perubahan Barang' : 'Simpan Barang Baru'}
          </Button>
        </div>
      </form>

      {/* Modal Scanner Barcode Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          setBarcode(scannedCode);
          setFormError('');
          setIsScannerOpen(false);
          setToast({
            isOpen: true,
            message: `Barcode "${scannedCode}" berhasil dipindai!`,
            type: 'success',
          });
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />

      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default ProductFormPage;
