import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatRupiah } from '@/utils/formatters';
import {
  PackagePlus,
  Scale,
  Layers,
  Save,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowDownLeft,
} from 'lucide-react';

export function QuickRestockModal({
  isOpen,
  onClose,
  product,
  variant = null,
  onSuccess,
}) {
  const queryClient = useQueryClient();

  const [addQty, setAddQty] = useState('10');
  const [selectedUnitId, setSelectedUnitId] = useState('base');
  const [notes, setNotes] = useState('Restok barang masuk');
  const [errorMsg, setErrorMsg] = useState('');

  const isVariant = Boolean(variant);
  const pName = product?.name || '';
  const vName = isVariant ? variant?.variant_name : '';
  const title = vName ? `Tambah Stok: ${pName} - ${vName}` : `Tambah Stok: ${pName}`;

  const currentStock = isVariant ? Number(variant?.stock || 0) : Number(product?.stock || 0);
  const baseUnitSymbol = isVariant
    ? (variant?.unit?.symbol || product?.unit?.symbol || 'Pcs')
    : (product?.unit?.symbol || 'Pcs');

  // Satuan penjualan yang tersedia
  const saleUnits = isVariant
    ? (variant?.sale_units || [])
    : (product?.sale_units || []);

  const chosenSaleUnit = saleUnits.find((s) => s.id === selectedUnitId) || null;
  const conversionMultiplier = chosenSaleUnit ? Number(chosenSaleUnit.conversion_qty || 1) : 1;

  const numAddQty = parseFloat(addQty) || 0;
  const totalBaseQtyToAdd = Math.round(numAddQty * conversionMultiplier * 1000) / 1000;
  const newFinalStock = Math.round((currentStock + totalBaseQtyToAdd) * 1000) / 1000;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setAddQty('10');
      setSelectedUnitId('base');
      setNotes('Restok barang masuk');
    }
  }, [isOpen, product, variant]);

  const restockMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (totalBaseQtyToAdd <= 0) {
        throw new Error('Jumlah stok yang ditambahkan harus lebih dari 0.');
      }

      if (isVariant && variant?.id) {
        // Update stock variant
        const { error: updErr } = await supabase
          .from('product_variants')
          .update({
            stock: newFinalStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', variant.id);

        if (updErr) throw updErr;

        // Catat stock movement
        await supabase.from('stock_movements').insert({
          product_id: product.id,
          variant_id: variant.id,
          movement_type: 'in',
          quantity: totalBaseQtyToAdd,
          notes: `${notes || 'Restok barang masuk'} (+${numAddQty} ${chosenSaleUnit ? chosenSaleUnit.name : baseUnitSymbol})`,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
        });
      } else if (product?.id) {
        // Update stock product utama
        const { error: updErr } = await supabase
          .from('products')
          .update({
            stock: newFinalStock,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (updErr) throw updErr;

        // Catat stock movement
        await supabase.from('stock_movements').insert({
          product_id: product.id,
          variant_id: null,
          movement_type: 'in',
          quantity: totalBaseQtyToAdd,
          notes: `${notes || 'Restok barang masuk'} (+${numAddQty} ${chosenSaleUnit ? chosenSaleUnit.name : baseUnitSymbol})`,
          created_by: user?.id || null,
          created_at: new Date().toISOString(),
        });
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      if (onSuccess) onSuccess({ newStock: newFinalStock, added: totalBaseQtyToAdd });
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menambahkan stok.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    restockMutation.mutate();
  };

  if (!isOpen || !product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Stok saat ini: ${currentStock} ${baseUnitSymbol}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Status Stok Saat Ini & Prediksi */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-700 font-medium block">Stok Saat Ini:</span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {currentStock} {baseUnitSymbol}
            </span>
          </div>

          <div className="text-slate-300 font-black text-base">→</div>

          <div className="text-right">
            <span className="text-emerald-700 font-medium block">Stok Setelah Ditambah:</span>
            <span className="text-base font-black text-emerald-800 font-mono">
              {newFinalStock} {baseUnitSymbol}
            </span>
          </div>
        </div>

        {/* Pilihan Satuan (Jika Multi-Satuan) */}
        {saleUnits.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Satuan Restok Masuk
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-emerald-500"
            >
              <option value="base">Satuan Dasar ({baseUnitSymbol} - Konversi 1)</option>
              {saleUnits.map((su) => (
                <option key={su.id} value={su.id}>
                  {su.name} (Isi {su.conversion_qty} {baseUnitSymbol})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Jumlah Tambah Stok */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Jumlah Stok Masuk <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="any"
              min="0.001"
              required
              autoFocus
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              placeholder="Contoh: 10, 20, 50..."
              className="w-full pl-3.5 pr-14 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {chosenSaleUnit ? chosenSaleUnit.name : baseUnitSymbol}
            </span>
          </div>

          {chosenSaleUnit && (
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              +{numAddQty} {chosenSaleUnit.name} = <strong>+{totalBaseQtyToAdd} {baseUnitSymbol}</strong> stok dasar
            </p>
          )}
        </div>

        {/* Catatan / Keterangan Masuk */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Catatan / Asal Stok (Opsional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Pembelian Agen Jaya, Kulakan Pasar..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:border-emerald-500"
          />
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
            icon={PackagePlus}
            isLoading={restockMutation.isPending}
            disabled={restockMutation.isPending || totalBaseQtyToAdd <= 0}
            className="py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 rounded-xl cursor-pointer"
          >
            + Tambah Stok
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default QuickRestockModal;
