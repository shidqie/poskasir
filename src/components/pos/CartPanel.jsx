import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { CartItem } from './CartItem';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/utils/formatters';
import {
  ShoppingCart,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  X,
} from 'lucide-react';

export function CartPanel({ onCheckout, isMobile = false, onCloseMobile }) {
  const {
    items,
    totalQuantity,
    totalAmount,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    removeItem,
    clearCart,
    lastWarning,
  } = useCartStore();

  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const handleConfirmClear = () => {
    clearCart();
    setIsClearDialogOpen(false);
  };

  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header Panel Keranjang */}
      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 leading-tight">
              Keranjang Belanja
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {items.length} jenis produk
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setIsClearDialogOpen(true)}
              className="p-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
              title="Kosongkan seluruh keranjang"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Kosongkan</span>
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Warning Box jika stok tidak mencukupi */}
      {lastWarning && (
        <div className="m-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2 animate-shake shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{lastWarning}</p>
        </div>
      )}

      {/* List Items Keranjang */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-700 text-sm">
              Keranjang masih kosong
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
              Cari atau scan barcode barang untuk memulai transaksi kasir.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onSetQuantity={setQuantity}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {/* Footer Summary & Checkout */}
      <div className="p-4 bg-white border-t border-slate-200/80 shrink-0 space-y-3 shadow-lg">
        {/* Rincian Total */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Total Kuantitas:</span>
            <span className="font-bold text-slate-900 text-sm">
              {totalQuantity} {items.length > 0 ? 'Item' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-sm">
            <span className="font-bold text-slate-700">Total Belanja:</span>
            <span className="font-black text-xl text-blue-600 font-mono">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Tombol Bayar */}
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={isEmpty}
          onClick={onCheckout}
          icon={Receipt}
          className="w-full py-3.5 text-sm sm:text-base font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
        >
          <span>Bayar {formatRupiah(totalAmount)}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Dialog Konfirmasi Kosongkan Keranjang */}
      <ConfirmDialog
        isOpen={isClearDialogOpen}
        onClose={() => setIsClearDialogOpen(false)}
        onConfirm={handleConfirmClear}
        title="Kosongkan Keranjang Belanja?"
        message="Semua daftar belanjaan yang telah dimasukkan ke dalam keranjang saat ini akan dihapus."
        confirmText="Kosongkan"
        type="danger"
      />
    </div>
  );
}

export default CartPanel;
