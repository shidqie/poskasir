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
      className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 ${
        isOutOfStock
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : 'bg-white border-slate-200/90 hover:border-red-400 hover:shadow-lg active:scale-[0.98] cursor-pointer'
      }`}
    >
      <div>
        {/* Top Product Image Container (Enlarged) */}
        <div className={`relative w-full h-32 sm:h-36 md:h-40 rounded-xl overflow-hidden mb-3 bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center`}>
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white drop-shadow-xs">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-xs mb-1.5">
                <IconComponent className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-black tracking-wider uppercase opacity-95">
                {theme.tag}
              </span>
            </div>
          )}

          {/* Top-Left Category Overlay Badge */}
          <div className="absolute top-2 left-2 max-w-[120px]">
            <span className="inline-block truncate px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-black/65 text-white backdrop-blur-xs shadow-xs">
              {categoryName}
            </span>
          </div>

          {/* Top-Right Status Badge */}
          <div className="absolute top-2 right-2">
            {hasVariants ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black bg-red-600 text-white shadow-md shadow-red-600/30">
                <Layers className="w-3 h-3" />
                {item.product_variants.length} Varian
              </span>
            ) : isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-rose-600 text-white shadow-xs">
                Habis
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500 text-white shadow-xs">
                Menipis
              </span>
            ) : isProduct ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold bg-emerald-600 text-white shadow-xs">
                Tersedia
              </span>
            ) : null}
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
          {item.name}
        </h3>

        {/* Code & Stock Info */}
        <div className="flex items-center justify-between gap-2 mt-1.5 text-xs text-slate-500">
          {item.code ? (
            <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200/60">
              {item.code}
            </span>
          ) : item.barcode && !hasVariants ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500 truncate max-w-[110px]">
              <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          ) : (
            <span />
          )}

          <span className="font-medium text-slate-600 text-xs shrink-0">
            Stok: <strong className="text-slate-900 font-bold">{totalStock} {unitSymbol}</strong>
          </span>
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="min-w-0">
          {hasVariants && isPriceStarting && (
            <span className="text-[10px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">
              Mulai
            </span>
          )}
          <div className="flex items-baseline truncate">
            <span className="text-base sm:text-lg lg:text-xl font-black text-slate-900 font-mono leading-none">
              {formatRupiah(displayPrice)}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">
              /{unitSymbol}
            </span>
          </div>
        </div>

        {/* Action Button (Larger & Touch-friendly) */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ml-2 transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : hasVariants
              ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
              : 'bg-red-600 text-white group-hover:bg-red-700 shadow-md shadow-red-500/25 active:scale-95'
          }`}
        >
          {hasVariants ? <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
