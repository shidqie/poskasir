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
      {/* Header Panel Keranjang */}
      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
              Keranjang Belanja
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {totalQuantity} {totalQuantity > 0 ? 'item terpilih' : 'item'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!isEmpty && (
            <button
              type="button"
              onClick={() => setIsClearDialogOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              title="Kosongkan seluruh keranjang"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
        <div className="m-3">
          <Alert variant="warning" title="Peringatan Stok">
            {lastWarning}
          </Alert>
        </div>
      )}

      {/* List Items Keranjang */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center">
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
            <span className="font-black text-xl text-red-600 font-mono">
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
          className="w-full py-3.5 text-sm sm:text-base font-bold shadow-md shadow-red-500/25 flex items-center justify-center gap-2"
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
