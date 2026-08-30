import React, { useState } from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getProductDummyImage } from '@/utils/dummyImages';
import { Plus, Barcode, Layers, ChevronRight, Package } from 'lucide-react';

export function ProductCard({ item, onAddToCart, onOpenVariants }) {
  const [imgError, setImgError] = useState(false);
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

  const categoryName = item.category?.name || item.categoryName || 'Sembako';
  const unitSymbol = item.unit?.symbol || item.unitSymbol || item.unit_name || 'Pcs';
  const imageUrl = getProductDummyImage(item.name, categoryName, item.image_url);

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
      className={`group relative flex flex-col justify-between p-3 rounded-2xl border text-left transition-all duration-200 ${
        isOutOfStock
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : 'bg-white border-slate-200/90 hover:border-red-400 hover:shadow-lg active:scale-[0.98] cursor-pointer'
      }`}
    >
      <div>
        {/* Top Product Image Container */}
        <div className="relative w-full h-28 sm:h-32 rounded-xl overflow-hidden bg-slate-100 mb-2.5 border border-slate-100">
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
              <Package className="w-8 h-8 opacity-40 mb-1" />
              <span className="text-[10px] font-bold uppercase">{categoryName}</span>
            </div>
          )}

          {/* Top-Left Category Overlay Badge */}
          <div className="absolute top-2 left-2 max-w-[120px]">
            <span className="inline-block truncate px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/65 text-white backdrop-blur-xs shadow-xs">
              {categoryName}
            </span>
          </div>

          {/* Top-Right Stock / Variant Overlay Badge */}
          <div className="absolute top-2 right-2">
            {hasVariants ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white shadow-md shadow-red-600/30">
                <Layers className="w-3 h-3" />
                {item.product_variants.length} Varian
              </span>
            ) : isProduct ? (
              <StockBadge
                stock={item.stock}
                minimumStock={minStock}
                unitSymbol={unitSymbol}
              />
            ) : (
              <StatusBadge status="unregistered" type="registration" />
            )}
          </div>
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
          {item.name}
        </h3>

        {/* Code & Barcode */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-mono text-slate-400">
          {item.code && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px] border border-slate-200/60">
              {item.code}
            </span>
          )}
          {item.barcode && !hasVariants && (
            <span className="flex items-center gap-0.5 truncate text-[10px] text-slate-500">
              <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          )}
          {hasVariants && (
            <span className="text-slate-500 font-sans text-[10px] font-medium">
              Stok: <strong className="text-slate-700">{totalStock} {unitSymbol}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div>
          {hasVariants && isPriceStarting && (
            <span className="text-[10px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">
              Mulai
            </span>
          )}
          <div className="flex items-baseline">
            <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
              {formatRupiah(displayPrice)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium ml-1">
              /{unitSymbol}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : hasVariants
              ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
              : 'bg-red-600 text-white group-hover:bg-red-700 shadow-md shadow-red-500/25 active:scale-95'
          }`}
        >
          {hasVariants ? <ChevronRight className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
