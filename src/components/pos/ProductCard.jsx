import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Barcode, AlertCircle } from 'lucide-react';

export function ProductCard({ item, onAddToCart }) {
  const isProduct = item.sourceType === 'product';
  const isOutOfStock = isProduct && Number(item.stock) <= 0;

  const handleClick = () => {
    if (isOutOfStock) return;
    onAddToCart(item);
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
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all ${
        isOutOfStock
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md active:scale-[0.98] cursor-pointer'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          {isProduct ? (
            <span className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
              {item.category?.name || item.categoryName || 'Sembako'}
            </span>
          ) : (
            <StatusBadge status="unregistered" type="registration" />
          )}

          {isProduct && (
            <StockBadge
              stock={item.stock}
              minimumStock={item.minimum_stock ?? item.minimumStock}
              unitSymbol={item.unit?.symbol || item.unitSymbol || ''}
            />
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>

        {/* Barcode & Code if available */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-400">
          {item.code && (
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
              {item.code}
            </span>
          )}
          {item.barcode && (
            <span className="flex items-center gap-0.5 truncate max-w-[130px]">
              <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          )}
        </div>
      </div>

      {/* Price & Add Button Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-base sm:text-lg font-black text-slate-900">
            {formatRupiah(item.selling_price || item.price)}
          </span>
          <span className="text-xs text-slate-500 font-medium ml-1">
            /{item.unit?.symbol || item.unitSymbol || item.unit_name || 'Pcs'}
          </span>
        </div>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
