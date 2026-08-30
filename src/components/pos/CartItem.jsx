import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { Plus, Minus, Trash2, Tag, Layers } from 'lucide-react';

export function CartItem({
  item,
  onIncrease,
  onDecrease,
  onSetQuantity,
  onRemove,
}) {
  const isTemporary = item.sourceType === 'temporary';
  const isDecimal = Boolean(item.allowDecimal);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      return;
    }
    onSetQuantity(item.id, val);
  };

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-2.5">
      {/* Row 1: Name, Variant, Price, and Remove button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-sm text-slate-900 leading-tight">
              {item.productName || item.name}
            </h4>
            {item.variantName && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200/80">
                <Layers className="w-3 h-3 text-red-600" />
                {item.variantName}
              </span>
            )}
            {isTemporary && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                <Tag className="w-2.5 h-2.5" />
                Belum Terdaftar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {formatRupiah(item.price)} <span className="text-slate-400">/ {item.unit}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
          title="Hapus dari keranjang"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Quantity Controls & Subtotal */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        {/* Quantity Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDecrease(item.id, isDecimal ? 0.25 : 1)}
            className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Kurangi kuantitas"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="number"
            step={isDecimal ? '0.001' : '1'}
            min={isDecimal ? '0.001' : '1'}
            value={item.quantity}
            onChange={handleInputChange}
            className="w-14 text-center py-1 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
          />

          <button
            type="button"
            onClick={() => onIncrease(item.id, isDecimal ? 0.25 : 1)}
            className="w-7 h-7 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
            title="Tambah kuantitas"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs text-slate-400 font-medium ml-1">
            {item.unit}
          </span>
        </div>

        {/* Subtotal */}
        <div className="text-right font-black text-sm text-slate-900 font-mono">
          {formatRupiah(item.subtotal)}
        </div>
      </div>
    </div>
  );
}

export default CartItem;
