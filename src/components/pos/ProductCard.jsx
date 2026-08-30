import React, { useState } from 'react';
import { formatRupiah } from '@/utils/formatters';
import { getProductCategoryTheme } from '@/utils/dummyImages';
import { Plus, Barcode, Layers, ChevronRight } from 'lucide-react';

export function ProductCard({ item, onAddToCart, onOpenVariants }) {
  const [imgError, setImgError] = useState(false);
  const isProduct = item.sourceType === 'product' || !item.sourceType;
  const hasVariants = Boolean(item.has_variants && item.product_variants?.length > 0);

  // Perhitungan stok & harga untuk produk bervarian vs produk biasa
  let isOutOfStock = false;
  let isLowStock = false;
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
    isLowStock = !isOutOfStock && minStock > 0 && Number(item.stock) <= minStock;
  }

  const handleClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      if (onOpenVariants) onOpenVariants(item);
    } else {
      if (onAddToCart) onAddToCart(item);
    }
  };

  const categoryName = item.category?.name || item.categoryName || 'Sembako';
  const unitSymbol = item.unit?.symbol || item.unitSymbol || item.unit_name || 'Pcs';
  const theme = getProductCategoryTheme(item.name, categoryName);
  const IconComponent = theme.Icon;
  const imageUrl = item.image_url || theme.photoUrl;

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
      className={`group relative flex flex-col justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all duration-150 ${
        isOutOfStock
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : 'bg-white border-slate-200/90 hover:border-red-400 hover:shadow-md active:scale-[0.99] cursor-pointer'
      }`}
    >
      <div>
        {/* Top Product Image Container (Compact Minimalist Medium) */}
        <div className={`relative w-full h-20 sm:h-24 rounded-lg overflow-hidden mb-2 bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center`}>
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white drop-shadow-xs">
              <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs mb-1">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                {theme.tag}
              </span>
            </div>
          )}

          {/* Top Badges Bar: Perfectly aligned and standardized */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none gap-1">
            <span className="truncate max-w-[90px] px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/75 text-white backdrop-blur-xs shadow-xs leading-none">
              {categoryName}
            </span>

            <div className="shrink-0 flex items-center">
              {hasVariants ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-red-600 text-white shadow-xs leading-none">
                  <Layers className="w-2.5 h-2.5" />
                  {item.product_variants.length} Varian
                </span>
              ) : isOutOfStock ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-600 text-white shadow-xs leading-none">
                  Habis
                </span>
              ) : isLowStock ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white shadow-xs leading-none">
                  Menipis
                </span>
              ) : isProduct ? (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-600 text-white shadow-xs leading-none">
                  Tersedia
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
          {item.name}
        </h3>

        {/* Code & Stock Info */}
        <div className="flex items-center justify-between gap-1.5 mt-1 text-[11px] text-slate-500">
          {item.code ? (
            <span className="font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-200/60">
              {item.code}
            </span>
          ) : item.barcode && !hasVariants ? (
            <span className="flex items-center gap-0.5 font-mono text-[9px] text-slate-400 truncate max-w-[90px]">
              <Barcode className="w-2.5 h-2.5 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          ) : (
            <span />
          )}

          <span className="font-medium text-slate-600 text-[10px] shrink-0">
            Stok: <strong className="text-slate-900 font-bold">{totalStock} {unitSymbol}</strong>
          </span>
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="min-w-0">
          {hasVariants && isPriceStarting && (
            <span className="text-[9px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">
              Mulai
            </span>
          )}
          <div className="flex items-baseline truncate">
            <span className="text-xs sm:text-sm font-black text-slate-900 font-mono leading-none">
              {formatRupiah(displayPrice)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium ml-0.5">
              /{unitSymbol}
            </span>
          </div>
        </div>

        {/* Action Button (Medium & Minimalist) */}
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ml-1.5 transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : hasVariants
              ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
              : 'bg-red-600 text-white group-hover:bg-red-700 shadow-xs active:scale-95'
          }`}
        >
          {hasVariants ? (
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
