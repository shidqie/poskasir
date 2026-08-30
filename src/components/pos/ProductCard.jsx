import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Plus, Barcode, Layers, ChevronRight } from 'lucide-react';

export function ProductCard({ item, onAddToCart, onOpenVariants }) {
  const isProduct = item.sourceType === 'product' || !item.sourceType;
  const hasVariants = Boolean(item.has_variants && item.product_variants?.length > 0);

  // Perhitungan stok & harga untuk produk bervarian vs produk biasa
  let isOutOfStock = false;
  let displayPrice = item.selling_price || item.price;
  let isPriceStarting = false;
  let totalStock = Number(item.stock) || 0;
  let minStock = item.minimum_stock ?? item.minimumStock ?? 0;

  if (hasVariants) {
    const variants = item.product_variants || [];
    const prices = variants.map((v) => Number(v.selling_price) || 0);
    const stocks = variants.map((v) => Number(v.stock) || 0);

    totalStock = stocks.reduce((a, b) => a + b, 0);
    displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
    isPriceStarting = prices.length > 1;
    isOutOfStock = totalStock <= 0;
  } else if (isProduct) {
    isOutOfStock = Number(item.stock) <= 0;
  }

  const handleClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      if (onOpenVariants) onOpenVariants(item);
    } else {
      if (onAddToCart) onAddToCart(item);
    }
  };

  const unitSymbol = item.unit?.symbol || item.unitSymbol || item.unit_name || 'Pcs';

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
          : 'bg-white border-slate-200 hover:border-red-400 hover:shadow-md active:scale-[0.98] cursor-pointer'
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

          {hasVariants ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200/80 shrink-0">
              <Layers className="w-3 h-3 text-red-600" />
              {item.product_variants.length} Varian
            </span>
          ) : isProduct ? (
            <StockBadge
              stock={item.stock}
              minimumStock={minStock}
              unitSymbol={unitSymbol}
            />
          ) : null}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
          {item.name}
        </h3>

        {/* Barcode & Code if available */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-400">
          {item.code && (
            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
              {item.code}
            </span>
          )}
          {item.barcode && !hasVariants && (
            <span className="flex items-center gap-0.5 truncate max-w-[130px]">
              <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          )}
          {hasVariants && (
            <span className="text-slate-500 font-sans text-[11px]">
              Total Stok: <strong className="text-slate-700">{totalStock} {unitSymbol}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          {hasVariants && isPriceStarting && (
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">
              Mulai
            </span>
          )}
          <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
            {formatRupiah(displayPrice)}
          </span>
          <span className="text-xs text-slate-500 font-medium ml-1">
            /{unitSymbol}
          </span>
        </div>

        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
          }`}
        >
          {hasVariants ? <ChevronRight className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
