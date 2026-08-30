import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import {
  Check,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Barcode,
  Coins,
  Warehouse,
} from 'lucide-react';
import { formatRupiah } from '@/utils/formatters';

const parseRaw = (v) => {
  const n = Number(String(v).replace(/\D/g, ''));
  return isNaN(n) ? 0 : n;
};

export function ApprovalModal({ isOpen, onClose, submission, onSuccess }) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [initialStock, setInitialStock] = useState('10');
  const [minimumStock, setMinimumStock] = useState('5');
  const [barcode, setBarcode] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitService.getUnits(),
  });

  // Prefill from submission
  useEffect(() => {
    if (isOpen && submission) {
      setName(submission.name || '');
      setVariantName(submission.variant_name || '');
      setSellingPrice(submission.selling_price ? String(submission.selling_price) : '');
      setBarcode(submission.barcode || '');
      setUnitId(submission.unit_id || (units.length > 0 ? units[0].id : ''));
      setCategoryId(submission.category_id || (categories.length > 0 ? categories[0].id : ''));
      setCostPrice('');
      setInitialStock('10');
      setMinimumStock('5');
      setHasVariants(false);
      setErrorMsg('');
      setDuplicateWarning(null);
    }
  }, [isOpen, submission, categories, units]);

  // Cek duplikasi barcode
  useEffect(() => {
    if (!barcode || barcode.length < 4) {
      setDuplicateWarning(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await productSubmissionService.checkDuplicate({
          barcode,
          name: name || submission?.name,
        });
        if (res.isDuplicate) {
          setDuplicateWarning({
            type: 'error',
            message: `Barcode "${barcode}" sudah dipakai pada ${res.description}!`,
          });
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {}
    }, 400);

    return () => clearTimeout(timer);
  }, [barcode, name, submission]);

  const isVariant = submission?.submission_type === 'new_variant';

  const approveMutation = useMutation({
    mutationFn: async () => {
      // 1. Update nama / varian / harga jika diubah oleh owner
      if (
        name !== submission.name ||
        variantName !== submission.variant_name ||
        parseRaw(sellingPrice) !== submission.selling_price
      ) {
        await productSubmissionService.updateSubmission(submission.id, {
          name,
          variant_name: isVariant ? variantName : null,
          selling_price: parseRaw(sellingPrice),
          barcode,
          category_id: categoryId || null,
          unit_id: unitId || null,
        });
      }

      // 2. Setujui secara resmi
      return productSubmissionService.approveSubmission({
        submission_id: submission.id,
        category_id: categoryId || null,
        unit_id: unitId || null,
        cost_price: parseRaw(costPrice),
        initial_stock: parseRaw(initialStock),
        minimum_stock: parseRaw(minimumStock),
        has_variants: hasVariants,
        barcode: barcode || null,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions-count'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menyetujui pengajuan barang.');
    },
  });

  const handleApprove = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (duplicateWarning?.type === 'error') {
      setErrorMsg('Barcode sudah digunakan produk lain. Ubah barcode terlebih dahulu.');
      return;
    }

    if (!isVariant && !categoryId) {
      setErrorMsg('Kategori barang wajib dipilih.');
      return;
    }

    if (!isVariant && !unitId) {
      setErrorMsg('Satuan barang wajib dipilih.');
      return;
    }

    approveMutation.mutate();
  };

  if (!submission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-xl"
      title="Setujui & Daftarkan ke Data Barang"
      subtitle="Lengkapi informasi master data sebelum barang resmi terdaftar di sistem POS"
    >
      <form onSubmit={handleApprove} className="space-y-4">
        {/* Edit Info Dasar Barang */}
        <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Informasi Barang (Dapat Disesuaikan oleh Owner)
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-bold text-[10px]">
              {isVariant ? 'Varian Baru' : 'Produk Baru'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={isVariant ? '' : 'sm:col-span-2'}>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nama Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama barang..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-red-500 text-slate-900"
              />
            </div>

            {isVariant && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Varian <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Nama varian..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-red-500 text-slate-900"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Harga Jual Satuan (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                required
                value={
                  sellingPrice ? Number(sellingPrice.replace(/\D/g, '')).toLocaleString('id-ID') : ''
                }
                onChange={(e) => setSellingPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-right outline-none focus:border-red-500 font-mono text-red-600"
              />
            </div>
          </div>
        </div>

        {/* Form Pelengkap Master Data */}
        {!isVariant && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kategori Barang <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 cursor-pointer"
                required
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
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Satuan Barang <span className="text-red-500">*</span>
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-red-500 cursor-pointer"
                required
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
        )}

        {/* Harga Pokok (Modal) & Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Harga Pokok / Modal (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={
                  costPrice ? Number(costPrice.replace(/\D/g, '')).toLocaleString('id-ID') : ''
                }
                onChange={(e) => setCostPrice(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-right outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Nomor Barcode / SKU
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Barcode className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Barcode barang..."
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* Duplicate warning */}
        {duplicateWarning && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{duplicateWarning.message}</span>
          </div>
        )}

        {/* Stok Awal & Stok Minimum */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Stok Awal Fisik
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Warehouse className="w-4 h-4" />
              </span>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-right outline-none focus:border-red-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Batas Stok Minimum
            </label>
            <input
              type="number"
              min="0"
              value={minimumStock}
              onChange={(e) => setMinimumStock(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-right outline-none focus:border-red-500 font-mono"
            />
          </div>
        </div>

        {/* Checkbox Has Variants (hanya jika new_product) */}
        {!isVariant && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-slate-800">Produk Memiliki Varian Rasa/Ukuran?</p>
              <p className="text-[11px] text-slate-500">
                Aktifkan jika produk ini memiliki beberapa opsi varian.
              </p>
            </div>
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded cursor-pointer accent-red-600"
            />
          </div>
        )}

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

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
            icon={Check}
            isLoading={approveMutation.isPending}
            disabled={approveMutation.isPending}
            className="py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 rounded-xl"
          >
            Setujui & Simpan Resmi
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ApprovalModal;
