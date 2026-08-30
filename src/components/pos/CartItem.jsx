import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { Plus, Minus, Trash2, Tag, Layers, Scale } from 'lucide-react';

export function CartItem({
  item,
  onIncrease,
  onDecrease,
  onSetQuantity,
  onRemove,
}) {
  const isTemporary = item.sourceType === 'temporary';
  const isDecimal = Boolean(item.allowDecimal);
  const unitLabel = item.saleUnitName || item.unit?.symbol || item.unitSymbol || item.unit_name || item.unit || 'Pcs';

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      return;
    }
    onSetQuantity(item.id, val);
  };

  return (
    <div className="p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-2">
      {/* Row 1: Name, Variant, Sale Unit, and Remove button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
              {item.productName || item.name}
            </h4>
            {item.variantName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                <Layers className="w-3 h-3 text-purple-600" />
                {item.variantName}
              </span>
            )}
            {item.saleUnitName && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                <Scale className="w-3 h-3 text-blue-600" />
                {item.saleUnitName}
              </span>
            )}
            {isTemporary && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                <Tag className="w-2.5 h-2.5" />
                Belum Terdaftar
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
            {formatRupiah(item.price || item.selling_price)} <span className="text-slate-400">/ {unitLabel}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Hapus dari keranjang"
          aria-label="Hapus item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row 2: Touch-friendly Quantity Controls & Subtotal */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
        {/* Quantity Controls with >=40px touch targets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDecrease(item.id, isDecimal ? 0.25 : 1)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-90 transition-all cursor-pointer font-bold select-none touch-manipulation"
            title="Kurangi kuantitas"
            aria-label="Kurang satu"
          >
            <Minus className="w-4 h-4" />
          </button>

          <input
            type="number"
            step={isDecimal ? '0.001' : '1'}
            min={isDecimal ? '0.001' : '1'}
            value={item.quantity}
            onChange={handleInputChange}
            className="w-14 sm:w-16 text-center py-1.5 text-xs sm:text-sm font-black bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white font-mono"
            aria-label="Jumlah kuantitas"
          />

          <button
            type="button"
            onClick={() => onIncrease(item.id, isDecimal ? 0.25 : 1)}
            className="w-9 h-9 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center justify-center hover:bg-red-100 active:scale-90 transition-all cursor-pointer font-bold select-none touch-manipulation"
            title="Tambah kuantitas"
            aria-label="Tambah satu"
          >
            <Plus className="w-4 h-4" />
          </button>

          <span className="text-[11px] text-slate-400 font-medium ml-1 truncate max-w-[50px]">
            {unitLabel}
          </span>
        </div>

        {/* Subtotal */}
        <div className="text-right font-black text-sm sm:text-base text-red-600 font-mono tracking-tight shrink-0">
          {formatRupiah(item.subtotal)}
        </div>
      </div>
    </div>
  );
}

export default CartItem;
