import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productService } from '@/services/productService';
import { productSubmissionService } from '@/services/productSubmissionService';
import { categoryService } from '@/services/categoryService';
import { unitService } from '@/services/unitService';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatRupiah } from '@/utils/formatters';
import {
  Edit2,
  Barcode,
  Package,
  Layers,
  Save,
  ExternalLink,
  Plus,
  Coins,
} from 'lucide-react';

const QUICK_INCREMENTS = [1000, 2000, 5000, 10000, 50000];

export function QuickEditPriceModal({
  isOpen,
  onClose,
  item,
  onSuccess,
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [variantName, setVariantName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isRegistered = item?.sourceType === 'registered' || item?.status === 'approved';
  const isSubmission = item?.status === 'pending' || item?.sourceType === 'unregistered';
  const hasVariant = Boolean(item?.variantId || item?.variantName);

  // Query categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
    enabled: isOpen,
  });

  // Query units
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitService.getUnits(),
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen && item) {
      setName(item.name || item.productName || '');
      setVariantName(item.variantName || '');
      setPrice(item.selling_price || item.price || 0);
      setStock(item.stock !== undefined ? item.stock : '');
      setBarcode(item.barcode || '');
      setCategoryId(item.categoryId || item.category_id || '');
      setUnitId(item.unitId || item.unit_id || '');
      setNotes(item.notes || '');
      setErrorMsg('');
    }
  }, [isOpen, item]);

  // Mutation Simpan
  const saveMutation = useMutation({
    mutationFn: async () => {
      const numPrice = Number(price) || 0;
      if (numPrice <= 0) {
        throw new Error('Harga jual harus lebih besar dari Rp0.');
      }

      if (isRegistered) {
        // Update Produk Resmi atau Varian
        const prodId = item.productId || item.id;
        if (hasVariant && item.variantId) {
          // Update varian spesifik
          const { error: varErr } = await supabase
            .from('product_variants')
            .update({
              selling_price: numPrice,
              stock: Number(stock) || 0,
              barcode: barcode.trim() || null,
              variant_name: variantName.trim() || undefined,
            })
            .eq('id', item.variantId);
          if (varErr) throw varErr;
        } else {
          // Update produk utama
          await productService.updateProduct(prodId, {
            name: name.trim(),
            selling_price: numPrice,
            stock: Number(stock) || 0,
            barcode: barcode.trim() || null,
            category_id: categoryId || null,
            unit_id: unitId || null,
          });
        }
      } else if (isSubmission) {
        // Update Pengajuan Pending
        const subId = item.rawSubmission?.id || item.id;
        await productSubmissionService.updateSubmission(subId, {
          name: name.trim(),
          variant_name: variantName.trim() || null,
          selling_price: numPrice,
          barcode: barcode.trim() || null,
          category_id: categoryId || null,
          unit_id: unitId || null,
          notes: notes.trim() || null,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-product-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });

      if (onSuccess) {
        onSuccess('Data barang dan harga berhasil diperbarui!');
      }
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Gagal menyimpan perubahan.');
    },
  });

  const handleQuickAddPrice = (addAmount) => {
    const cur = Number(price) || 0;
    setPrice(cur + addAmount);
  };

  const handleOpenFullForm = () => {
    const prodId = item?.productId || item?.id;
    onClose();
    if (prodId) {
      navigate(`/owner/products/${prodId}/edit`);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200 shadow-xs">
            <Edit2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              {isRegistered ? 'Ubah Cepat Harga & Barang' : 'Ubah Data Pengajuan Harga'}
            </h3>
            <p className="text-[11px] text-slate-500 font-normal">
              {item.name} {variantName ? `(${variantName})` : ''}
            </p>
          </div>
        </div>
      }
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="space-y-4"
      >
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* Input Nama Barang */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1">
            Nama Barang
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={hasVariant && isRegistered}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-red-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        {/* Input Varian jika ada */}
        {(hasVariant || isSubmission) && (
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nama Varian (Rasa / Ukuran)
            </label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              placeholder="Mis. Original, Cokelat, 250ml, dll."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:border-red-500"
            />
          </div>
        )}

        {/* Input Harga Jual & Quick Increment Buttons */}
        <div className="p-3.5 bg-red-50/50 rounded-2xl border border-red-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Coins size={14} className="text-red-600" />
              <span>Harga Jual (Rp)</span>
            </label>
            <span className="font-mono font-black text-sm text-red-600">
              {formatRupiah(price)}
            </span>
          </div>

          <input
            type="number"
            required
            min="0"
            step="100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl text-lg font-black font-mono text-right outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          />

          {/* Tombol Cepat Tambah Harga */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
              + Cepat:
            </span>
            {QUICK_INCREMENTS.map((inc) => (
              <button
                key={inc}
                type="button"
                onClick={() => handleQuickAddPrice(inc)}
                className="px-2 py-1 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
              >
                +{inc >= 1000 ? `${inc / 1000}rb` : inc}
              </button>
            ))}
          </div>
        </div>

        {/* Input Barcode & Stok */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Nomor Barcode
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan / ketik barcode..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:bg-white focus:border-red-500"
            />
          </div>

          {isRegistered && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Stok Saat Ini
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-right outline-none focus:bg-white focus:border-red-500"
              />
            </div>
          )}
        </div>

        {/* Kategori & Satuan (Jika produk utama atau submission) */}
        {(!hasVariant || isSubmission) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Kategori
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-red-500"
              >
                <option value="">Pilih Kategori...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Satuan
              </label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-red-500"
              >
                <option value="">Pilih Satuan...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
          {isRegistered ? (
            <button
              type="button"
              onClick={handleOpenFullForm}
              className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink size={13} />
              <span>Form Lengkap</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={saveMutation.isPending}
              className="rounded-xl font-bold text-xs"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveMutation.isPending}
              icon={Save}
              className="rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              Simpan Perubahan
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default QuickEditPriceModal;
