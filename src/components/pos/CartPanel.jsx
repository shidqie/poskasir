import React, { useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { CartItem } from './CartItem';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatRupiah } from '@/utils/formatters';
import {
  ShoppingCart,
  Trash2,
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
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200/80">
      {/* Header Panel Keranjang (Medium Minimalist) */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
              Keranjang Belanja
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              {totalQuantity} {totalQuantity > 0 ? 'item terpilih' : 'item'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setIsClearDialogOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              title="Kosongkan seluruh keranjang"
            >
              <Trash2 className="w-3 h-3" />
              <span>Kosongkan</span>
            </button>
          )}

          {isMobile && onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Warning Box jika stok tidak mencukupi */}
      {lastWarning && (
        <div className="m-2.5">
          <Alert variant="warning" title="Peringatan Stok">
            {lastWarning}
          </Alert>
        </div>
      )}

      {/* List Items Keranjang */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center p-4">
            <EmptyState
              icon={ShoppingCart}
              title="Keranjang Masih Kosong"
              description="Pilih atau scan barcode barang untuk memulai transaksi kasir."
            />
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
      <div className="p-3.5 bg-white border-t border-slate-200/80 shrink-0 space-y-2.5 shadow-lg">
        {/* Rincian Total */}
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px]">Total Kuantitas:</span>
            <span className="font-bold text-slate-900 text-xs">
              {totalQuantity} {items.length > 0 ? 'Item' : ''}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="font-bold text-slate-700 text-xs sm:text-sm">Total Belanja:</span>
            <span className="font-black text-lg sm:text-xl text-red-600 font-mono">
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Tombol Bayar */}
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={isEmpty}
          onClick={onCheckout}
          icon={Receipt}
          className="w-full py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-red-500/25 flex items-center justify-center gap-1.5"
        >
          <span>Bayar {formatRupiah(totalAmount)}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
