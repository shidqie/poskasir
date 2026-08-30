import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import { variantService } from '@/services/variantService';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { ToggleSwitch } from '@/components/common/ToggleSwitch';
import { Alert } from '@/components/common/Alert';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import {
  ArrowLeft,
  Save,
  Package,
  Barcode,
  Camera,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

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

  // Variant States
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);

  // Barcode scanner modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeScanningVariantIdx, setActiveScanningVariantIdx] = useState(null);

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
      setHasVariants(Boolean(productData.has_variants));
      if (productData.product_variants && productData.product_variants.length > 0) {
        setVariants(productData.product_variants);
      }
    } else if (!isEdit) {
      productService.getNextProductCode().then((nextCode) => {
        setCode(nextCode);
      });
    }
  }, [isEdit, productData]);

  // Cek apakah satuan yang dipilih mengizinkan desimal
  const selectedUnit = units.find((u) => u.id === unitId);
  const allowDecimal = Boolean(selectedUnit?.allow_decimal);

  // Helper untuk menambah baris varian baru
  const handleAddVariant = () => {
    const nextIdx = variants.length + 1;
    setVariants([
      ...variants,
      {
        variant_name: '',
        code: `${code || 'BRG'}-V${nextIdx}`,
        barcode: '',
        selling_price: sellingPrice || 0,
        stock: 0,
        minimum_stock: 5,
        unit_id: unitId || (units[0]?.id || null),
        status: true,
      },
    ]);
  };

  const handleUpdateVariant = (idx, field, value) => {
    const updated = [...variants];
    updated[idx] = {
      ...updated[idx],
      [field]: value,
    };
    setVariants(updated);
  };

  const handleRemoveVariant = (idx) => {
    const updated = variants.filter((_, i) => i !== idx);
    setVariants(updated);
  };

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
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
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

    if (hasVariants) {
      if (variants.length === 0) {
        setFormError('Produk bervarian harus memiliki minimal 1 varian.');
        return;
      }

      // Validasi varian
      const namesSet = new Set();
      const barcodeSet = new Set();

      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.variant_name.trim()) {
          setFormError(`Nama varian ke-${i + 1} wajib diisi.`);
          return;
        }

        const lowerName = v.variant_name.trim().toLowerCase();
        if (namesSet.has(lowerName)) {
          setFormError(`Varian dengan nama "${v.variant_name}" tidak boleh duplikat dalam produk ini.`);
          return;
        }
        namesSet.add(lowerName);

        if (Number(v.selling_price) < 0) {
          setFormError(`Harga jual varian "${v.variant_name}" tidak boleh bernilai negatif.`);
          return;
        }

        if (Number(v.stock) < 0) {
          setFormError(`Stok varian "${v.variant_name}" tidak boleh bernilai negatif.`);
          return;
        }

        if (v.barcode && v.barcode.trim()) {
          const bc = v.barcode.trim();
          if (barcodeSet.has(bc)) {
            setFormError(`Barcode "${bc}" duplikat antar varian.`);
            return;
          }
          barcodeSet.add(bc);
        }
      }
    } else {
      if (Number(sellingPrice) < 0) {
        setFormError('Harga jual tidak boleh bernilai negatif.');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      code: code.trim(),
      barcode: hasVariants ? null : (barcode.trim() || null),
      category_id: categoryId,
      unit_id: unitId,
      selling_price: hasVariants ? 0 : Number(sellingPrice) || 0,
      stock: hasVariants ? 0 : Number(stock) || 0,
      minimum_stock: hasVariants ? 0 : Number(minimumStock) || 0,
      status,
      has_variants: hasVariants,
      variants: hasVariants ? variants : [],
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
      {/* Breadcrumbs Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Data Master Barang', to: '/owner/products' },
          { label: isEdit ? 'Ubah Data Barang' : 'Tambah Barang Baru' },
        ]}
      />

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
          <Alert variant="danger" title="Terjadi Kesalahan">
            {formError}
          </Alert>
        )}

        {/* Card 1: Informasi Dasar Produk */}
        <Card title="Informasi Utama Produk">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Nama Produk */}
            <div className="sm:col-span-2">
              <Input
                id="product-name"
                name="name"
                label="Nama Barang Induk"
                placeholder="Contoh: Indomie, Aqua, Beras Ramos, Minyak Goreng..."
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFormError('');
                }}
                disabled={saveMutation.isPending}
              />
            </div>

            {/* Kode Barang */}
            <Input
              id="product-code"
              name="code"
              label="Kode Barang (Otomatis)"
              value={code}
              readOnly
              disabled
              helperText="Kode internal produk dibuat otomatis oleh sistem"
            />

            {/* Kategori Select */}
            <Select
              id="product-category"
              label="Kategori"
              required
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setFormError('');
              }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="-- Pilih Kategori --"
              disabled={saveMutation.isPending}
            />

            {/* Satuan Default Select */}
            <div className="sm:col-span-2">
              <Select
                id="product-unit"
                label="Satuan Default"
                required
                value={unitId}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  setFormError('');
                }}
                options={units.map((u) => ({
                  value: u.id,
                  label: `${u.name} (${u.symbol}) ${u.allow_decimal ? '(Pecahan/Kg)' : ''}`,
                }))}
                placeholder="-- Pilih Satuan --"
                disabled={saveMutation.isPending}
                helperText="Satuan utama yang digunakan untuk produk dan varian default"
              />
            </div>
          </div>

          {/* Switch: Produk memiliki varian? */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <ToggleSwitch
              label="Produk Memiliki Varian?"
              description="Aktifkan jika produk memiliki berbagai rasa, ukuran, atau kemasan (contoh: Indomie Goreng, Rendang, Soto)"
              checked={hasVariants}
              onChange={(val) => {
                setHasVariants(val);
                if (val && variants.length === 0) {
                  handleAddVariant();
                }
              }}
              disabled={saveMutation.isPending}
            />
          </div>
        </Card>

        {/* Card 2: Form Produk Biasa (Jika hasVariants = false) */}
        {!hasVariants ? (
          <Card title="Harga & Persediaan Stok (Produk Tunggal)">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Barcode */}
              <div className="sm:col-span-2">
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
                      onClick={() => {
                        setActiveScanningVariantIdx(null);
                        setIsScannerOpen(true);
                      }}
                      disabled={saveMutation.isPending}
                      className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5 text-red-600" />
                      <span>Scan Kamera</span>
                    </button>
                  }
                  helperText="Barcode pada kemasan produk untuk scan langsung di POS"
                />
              </div>

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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold font-mono"
                />
              </div>

              {/* Stok Minimum */}
              <div className="sm:col-span-2">
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
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Status akan menjadi "Menipis" jika stok mencapai angka ini
                </p>
              </div>
            </div>
          </Card>
        ) : (
          /* Card 3: Form Varian Produk (Jika hasVariants = true) */
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-600" />
                  <span>Daftar Varian Produk ({variants.length})</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  onClick={handleAddVariant}
                  disabled={saveMutation.isPending}
                >
                  Tambah Varian
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Setiap varian memiliki barcode, harga jual, dan stok tersendiri. Saat transaksi di kasir, stok yang berkurang adalah stok dari varian yang dipilih.
              </p>

              {variants.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <Layers className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-semibold text-sm text-slate-700">Belum Ada Varian</p>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Klik tombol di bawah untuk menambahkan varian rasa atau ukuran produk.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={handleAddVariant}
                  >
                    + Tambah Varian Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Varian #{idx + 1}
                        </span>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Hapus Varian Ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Nama Varian */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Varian <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Goreng Original, Rendang, 600 ml..."
                            required
                            value={v.variant_name}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'variant_name', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold"
                          />
                        </div>

                        {/* Barcode Varian */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Barcode Varian (Opsional)
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder="Barcode kemasan..."
                              value={v.barcode || ''}
                              onChange={(e) =>
                                handleUpdateVariant(idx, 'barcode', e.target.value)
                              }
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveScanningVariantIdx(idx);
                                setIsScannerOpen(true);
                              }}
                              className="p-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
                              title="Scan Barcode Varian"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Harga Jual */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Harga Jual <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            placeholder="0"
                            value={v.selling_price}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'selling_price', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-bold font-mono text-right"
                          />
                        </div>

                        {/* Stok Awal */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Stok Awal <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={v.stock}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'stock', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-bold font-mono"
                          />
                        </div>

                        {/* Minimum Stok */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Min. Stok
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.minimum_stock}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'minimum_stock', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-bold font-mono"
                          />
                        </div>

                        {/* Satuan Varian */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Satuan
                          </label>
                          <select
                            value={v.unit_id || unitId}
                            onChange={(e) =>
                              handleUpdateVariant(idx, 'unit_id', e.target.value)
                            }
                            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none font-semibold"
                          >
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.symbol}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Status Produk Aktif Switch */}
        <Card bodyClassName="p-4">
          <ToggleSwitch
            label="Status Produk Utama"
            description="Jika dinonaktifkan, seluruh varian produk ini tidak akan muncul di katalog penjualan kasir."
            checked={status}
            onChange={setStatus}
            disabled={saveMutation.isPending}
          />
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
        onClose={() => {
          setIsScannerOpen(false);
          setActiveScanningVariantIdx(null);
        }}
        onScanSuccess={(scannedCode) => {
          if (activeScanningVariantIdx !== null) {
            handleUpdateVariant(activeScanningVariantIdx, 'barcode', scannedCode);
          } else {
            setBarcode(scannedCode);
          }
          setFormError('');
          setIsScannerOpen(false);
          setActiveScanningVariantIdx(null);
          setToast({
            isOpen: true,
            message: `Barcode "${scannedCode}" berhasil dipindai!`,
            type: 'success',
          });
        }}
        onManualSearch={() => {
          setIsScannerOpen(false);
          setActiveScanningVariantIdx(null);
        }}
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
