import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Barcode, Plus, Check } from 'lucide-react';

export function VariantCard({
  variant,
  productName,
  unitSymbol = 'Pcs',
  onSelect,
  isSelected = false,
  disabled = false,
  className = '',
}) {
  const isOutOfStock = Number(variant.stock) <= 0 || disabled;

  const handleClick = () => {
    if (isOutOfStock) return;
    if (onSelect) onSelect(variant);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isOutOfStock) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 ${
        isOutOfStock
          ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : isSelected
          ? 'bg-red-50/80 border-red-500 shadow-xs'
          : 'bg-white border-slate-200/90 hover:border-red-400 hover:shadow-md active:scale-[0.99] cursor-pointer group'
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 transition-colors">
            {variant.variant_name}
          </h4>
          <StockBadge
            stock={variant.stock}
            minimumStock={variant.minimum_stock}
            unitSymbol={variant.unit?.symbol || unitSymbol}
          />
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
          <span className="text-slate-700 font-semibold">{variant.code}</span>
          {variant.barcode && (
            <span className="flex items-center gap-1 text-slate-400">
              <Barcode className="w-3.5 h-3.5" />
              {variant.barcode}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-3">
        <div>
          <p className="font-black text-base sm:text-lg text-slate-900 font-mono">
            {formatRupiah(variant.selling_price)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium">
            /{variant.unit?.symbol || unitSymbol}
          </p>
        </div>

        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : isSelected
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
          }`}
        >
          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

export default VariantCard;
