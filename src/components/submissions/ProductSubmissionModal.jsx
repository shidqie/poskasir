import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { unitService } from '@/services/unitService';
import { categoryService } from '@/services/categoryService';
import { productService } from '@/services/productService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import {
  Send,
  Barcode,
  Camera,
  Layers,
  AlertCircle,
  Package,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

const QUICK_PRICES = [1000, 2000, 5000, 10000, 15000, 20000, 50000];

export function ProductSubmissionModal({
  isOpen,
  onClose,
  initialBarcode = '',
  initialName = '',
  onSuccess,
}) {
  const queryClient = useQueryClient();
  const [submissionType, setSubmissionType] = useState('new_product'); // 'new_product' | 'new_variant'
  const [name, setName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [parentProductId, setParentProductId] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Query categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
  });

  // Query units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitService.getUnits(),
  });

  // Query parent products for variant selection
  const { data: products = [] } = useQuery({
    queryKey: ['products-for-variant', parentSearch],
    queryFn: () => productService.getProducts({ search: parentSearch, limit: 10 }),
    enabled: submissionType === 'new_variant',
  });

  // Prefill initial values
  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setVariantName('');
      setBarcode(initialBarcode || '');
      setSellingPrice('');
      setCategoryId('');
      setNotes('');
      setErrorMsg('');
      setDuplicateWarning(null);
      setSubmissionType('new_product');
      setParentProductId('');
      setParentSearch('');
      if (units.length > 0 && !unitId) {
        setUnitId(units[0].id);
      }
    }
  }, [isOpen, initialBarcode, initialName, units]);

  // Cek duplikasi saat barcode berubah
  useEffect(() => {
    if (!barcode || barcode.length < 4) {
      setDuplicateWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productSubmissionService.checkDuplicate({ barcode, name });
        if (res.isDuplicate) {
          setDuplicateWarning({
            type: 'error',
            message: `Barcode sudah digunakan pada ${res.description}.`,
          });
        } else if (res.hasSimilar) {
          setDuplicateWarning({
            type: 'warning',
            message: `Ada produk serupa: "${res.similarItems[0]?.name}". Pastikan barang bukan duplikat.`,
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {}
    }, 400);

    return () => clearTimeout(timer);
  }, [barcode, name]);

  const submitMutation = useMutation({
    mutationFn: () =>
      productSubmissionService.createSubmission({
        name: submissionType === 'new_product' ? name : products.find((p) => p.id === parentProductId)?.name || name,
        variant_name: submissionType === 'new_variant' ? variantName : null,
        submission_type: submissionType,
        parent_product_id: submissionType === 'new_variant' ? parentProductId : null,
        selling_price: parseRaw(sellingPrice),
        barcode: barcode || null,
        category_id: submissionType === 'new_product' ? categoryId || null : null,
        unit_id: unitId || null,
        notes: notes || null,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions-count'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal mengirim pengajuan barang.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (submissionType === 'new_product' && !name.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }

    if (submissionType === 'new_variant') {
      if (!parentProductId) {
        setErrorMsg('Pilih produk induk terlebih dahulu.');
        return;
      }
      if (!variantName.trim()) {
        setErrorMsg('Nama varian baru wajib diisi.');
        return;
      }
    }

    if (!parseRaw(sellingPrice)) {
      setErrorMsg('Harga jual wajib diisi dan lebih dari Rp0.');
      return;
    }

    submitMutation.mutate();
  };

  const handleScanDetected = (scannedCode) => {
    setBarcode(scannedCode);
    setIsScannerOpen(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="max-w-lg"
        title="Ajukan Barang Baru ke Pemilik"
        subtitle="Barang akan berstatus 'Menunggu Persetujuan' dan siap direview oleh Pemilik"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipe Pengajuan: Produk Baru vs Varian Baru */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSubmissionType('new_product')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                submissionType === 'new_product'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Produk Baru</span>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('new_variant')}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                submissionType === 'new_variant'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Varian Produk Baru</span>
            </button>
          </div>

          {/* Form Fields: Produk Baru */}
          {submissionType === 'new_product' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama barang..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                autoFocus
              />
            </div>
          )}

          {/* Form Fields: Varian Baru */}
          {submissionType === 'new_variant' && (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pilih Produk Induk <span className="text-red-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={parentSearch}
                    onChange={(e) => setParentSearch(e.target.value)}
                    placeholder="Cari produk induk..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-1.5 rounded-xl border border-slate-200">
                  {products.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Ketik nama produk induk di atas
                    </p>
                  ) : (
                    products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedParentProduct(p);
                          if (p.unit_id) setUnitId(p.unit_id);
                          if (p.category_id) setCategoryId(p.category_id);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          selectedParentProduct?.id === p.id
                            ? 'bg-red-50 text-red-700 font-bold border border-red-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {p.code}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {selectedParentProduct && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Varian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantName}
                    onChange={(e) => setVariantName(e.target.value)}
                    placeholder="Nama varian..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                </div>
              )}
            </div>
          )}

          {/* Kategori (khusus new_product) */}
          {submissionType === 'new_product' && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kategori Barang
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 cursor-pointer"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Grid Harga Jual & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Harga Jual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
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
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-right outline-none focus:bg-white focus:border-red-500 font-mono text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Satuan Barang
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 cursor-pointer"
              >
                <option value="">-- Pilih Satuan --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Price Chips */}
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {QUICK_PRICES.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setSellingPrice(String(amt))}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                {amt >= 1000 ? `${amt / 1000}rb` : amt}
              </button>
            ))}
          </div>

          {/* Barcode & Scan Kamera */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Barcode / SKU Barang (Opsional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Barcode className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Nomor barcode..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono outline-none focus:bg-white focus:border-red-500"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                icon={Camera}
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-2.5 text-xs font-bold shrink-0 rounded-xl border-slate-200 hover:border-red-500 hover:text-red-600"
              >
                Scan
              </Button>
            </div>
          </div>

          {/* Duplicate Warning Box */}
          {duplicateWarning && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                duplicateWarning.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{duplicateWarning.message}</span>
            </div>
          )}

          {/* Catatan */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Catatan Pengajuan (opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan pengajuan..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:bg-white focus:border-red-500 resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Pengajuan ini akan langsung tersimpan dengan status <strong>Menunggu Persetujuan</strong> dan muncul di tab <em>Pengajuan Saya</em>. Pemilik toko akan memeriksa dan menyetujuinya.
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="py-3 text-xs font-bold rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              isLoading={submitMutation.isPending}
              disabled={submitMutation.isPending}
              className="py-3 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/25 rounded-xl"
            >
              Ajukan Barang ke Pemilik
            </Button>
          </div>
        </form>
      </Modal>

      {/* Barcode Scanner Modal Camera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanDetected}
        onDetected={handleScanDetected}
      />
    </>
  );
}

export default ProductSubmissionModal;
