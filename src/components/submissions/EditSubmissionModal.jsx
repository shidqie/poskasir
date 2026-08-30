import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productSubmissionService } from '@/services/productSubmissionService';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { Button } from '@/components/common/Button';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { AlertCircle, Camera, Check, Barcode } from 'lucide-react';

export function EditSubmissionModal({ isOpen, onClose, submission, onSuccess }) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitService.getUnits(),
  });

  useEffect(() => {
    if (isOpen && submission) {
      setName(submission.name || '');
      setVariantName(submission.variant_name || '');
      setSellingPrice(submission.selling_price ? String(submission.selling_price) : '');
      setBarcode(submission.barcode || '');
      setCategoryId(submission.category_id || '');
      setUnitId(submission.unit_id || '');
      setNotes(submission.notes || '');
      setErrorMsg('');
    }
  }, [isOpen, submission]);

  const isVariant = submission?.submission_type === 'new_variant';

  const updateMutation = useMutation({
    mutationFn: () =>
      productSubmissionService.updateSubmission(submission.id, {
        name,
        variant_name: isVariant ? variantName : null,
        selling_price: Number(sellingPrice) || 0,
        barcode,
        category_id: categoryId || null,
        unit_id: unitId || null,
        notes,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-submissions-count'] });
      if (onSuccess) onSuccess(data);
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal mengubah data pengajuan barang.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi.');
      return;
    }
    if (Number(sellingPrice) < 0) {
      setErrorMsg('Harga jual tidak boleh bernilai negatif.');
      return;
    }
    updateMutation.mutate();
  };

  if (!submission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-lg"
      title="Ubah Data Pengajuan Barang"
      subtitle="Edit informasi barang atau sesuaikan harga sebelum persetujuan resmi"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Barang */}
        <Input
          id="edit-sub-name"
          name="name"
          label="Nama Barang"
          placeholder="Nama barang..."
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrorMsg('');
          }}
          disabled={updateMutation.isPending}
        />

        {/* Nama Varian (jika tipe varian) */}
        {isVariant && (
          <Input
            id="edit-sub-variant"
            name="variant_name"
            label="Nama Varian"
            placeholder="Nama varian..."
            required
            value={variantName}
            onChange={(e) => {
              setVariantName(e.target.value);
              setErrorMsg('');
            }}
            disabled={updateMutation.isPending}
          />
        )}

        {/* Grid Harga & Barcode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyInput
            id="edit-sub-price"
            name="selling_price"
            label="Harga Jual Pengajuan"
            required
            value={sellingPrice}
            onChange={(val) => {
              setSellingPrice(val);
              setErrorMsg('');
            }}
            disabled={updateMutation.isPending}
          />

          <Input
            id="edit-sub-barcode"
            name="barcode"
            label="Barcode (Opsional)"
            placeholder="Barcode kemasan..."
            value={barcode}
            onChange={(e) => {
              setBarcode(e.target.value);
              setErrorMsg('');
            }}
            icon={Barcode}
            disabled={updateMutation.isPending}
            rightElement={
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                disabled={updateMutation.isPending}
                className="px-2 py-1 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-md border border-red-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                title="Scan Barcode via Kamera"
              >
                <Camera className="w-3.5 h-3.5 text-red-600" />
                <span>Scan</span>
              </button>
            }
          />
        </div>

        {/* Grid Kategori & Satuan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="edit-sub-category"
            label="Kategori Barang"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="-- Pilih Kategori --"
            disabled={updateMutation.isPending}
          />

          <Select
            id="edit-sub-unit"
            label="Satuan Barang"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            options={units.map((u) => ({
              value: u.id,
              label: `${u.name} (${u.symbol})`,
            }))}
            placeholder="-- Pilih Satuan --"
            disabled={updateMutation.isPending}
          />
        </div>

        {/* Catatan */}
        <Textarea
          id="edit-sub-notes"
          label="Catatan Pengajuan"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan tambahan keperluan barang..."
          disabled={updateMutation.isPending}
        />

        {/* Error Message */}
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
            disabled={updateMutation.isPending}
            className="py-2.5 text-xs font-bold rounded-xl"
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Check}
            isLoading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            className="py-2.5 text-xs font-bold rounded-xl"
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedCode) => {
          setBarcode(scannedCode);
          setIsScannerOpen(false);
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />
    </Modal>
  );
}

export default EditSubmissionModal;
