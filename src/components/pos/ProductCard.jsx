import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { getProductCategoryTheme } from '@/utils/dummyImages';
import { Plus, Barcode, Layers, ChevronRight, Scale } from 'lucide-react';

export function ProductCard({ item, onAddToCart, onOpenVariants, onOpenSaleUnits }) {
  const isProduct = item.sourceType === 'product' || !item.sourceType;
  const hasVariants = Boolean(item.has_variants && item.product_variants?.length > 0);
  const saleUnits = item.sale_units || [];
  const hasMultipleSaleUnits = !hasVariants && saleUnits.length > 1;

  // Perhitungan stok & harga untuk produk bervarian vs produk multi-satuan vs produk biasa
  let isOutOfStock = false;
  let isLowStock = false;
  let displayPrice = Number(item.selling_price || item.price) || 0;
  let isPriceStarting = false;
  let totalStock = Number(item.stock) || 0;
  let minStock = item.minimum_stock ?? item.minimumStock ?? 0;

  if (hasVariants) {
    const variants = item.product_variants || [];
    const prices = [];
    const stocks = variants.map((v) => Number(v.stock) || 0);

    variants.forEach((v) => {
      if (v.sale_units && v.sale_units.length > 0) {
        v.sale_units.forEach((su) => prices.push(Number(su.selling_price) || 0));
      } else {
        prices.push(Number(v.selling_price) || 0);
      }
    });

    totalStock = stocks.reduce((a, b) => a + b, 0);
    displayPrice = prices.length > 0 ? Math.min(...prices) : 0;
    isPriceStarting = prices.length > 1;
    isOutOfStock = totalStock <= 0;
  } else if (hasMultipleSaleUnits) {
    const prices = saleUnits.map((su) => Number(su.selling_price) || 0);
    if (item.selling_price) prices.push(Number(item.selling_price));
    displayPrice = prices.length > 0 ? Math.min(...prices) : Number(item.selling_price || 0);
    isPriceStarting = true;
    isOutOfStock = Number(item.stock) <= 0;
    isLowStock = !isOutOfStock && minStock > 0 && Number(item.stock) <= minStock;
  } else if (isProduct) {
    if (saleUnits.length === 1) {
      displayPrice = Number(saleUnits[0].selling_price) || displayPrice;
    }
    isOutOfStock = Number(item.stock) <= 0;
    isLowStock = !isOutOfStock && minStock > 0 && Number(item.stock) <= minStock;
  }

  const handleClick = () => {
    if (isOutOfStock) return;
    if (hasVariants) {
      if (onOpenVariants) onOpenVariants(item);
    } else if (hasMultipleSaleUnits) {
      if (onOpenSaleUnits) onOpenSaleUnits(item);
      else if (onAddToCart) onAddToCart(item);
    } else {
      if (onAddToCart) onAddToCart(item);
    }
  };

  const categoryName = item.category?.name || item.categoryName || 'Sembako';
  const unitSymbol = item.unit?.symbol || item.unitSymbol || item.unit_name || 'Btl';
  const theme = getProductCategoryTheme(item.name, categoryName);
  const IconComponent = theme.Icon;

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
      className={`group relative flex flex-col justify-between p-3 sm:p-3.5 rounded-3xl border text-left transition-all duration-150 ${
        isOutOfStock
          ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
          : 'bg-white border-slate-200/90 hover:border-slate-400 hover:shadow-md active:scale-[0.99] cursor-pointer'
      }`}
    >
      <div>
        {/* Top Category Dummy Graphic Banner (No Photos) */}
        <div
          className={`relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden mb-3 bg-gradient-to-b ${theme.bgGradient} flex flex-col items-center justify-center text-white shadow-inner`}
        >
          {/* Top Badges Bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none gap-1">
            <span className="truncate max-w-[110px] px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/85 text-white shadow-xs leading-none">
              {categoryName}
            </span>

            <div className="shrink-0 flex items-center gap-1">
              {hasVariants ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs leading-none">
                  <Layers className="w-3 h-3" />
                  {item.product_variants.length} Varian
                </span>
              ) : hasMultipleSaleUnits ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white shadow-xs leading-none">
                  <Scale className="w-3 h-3" />
                  {saleUnits.length} Satuan
                </span>
              ) : isOutOfStock ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs leading-none">
                  Habis
                </span>
              ) : isLowStock ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs leading-none">
                  Menipis
                </span>
              ) : isProduct ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs leading-none">
                  Tersedia
                </span>
              ) : null}
            </div>
          </div>

          {/* Center Category Icon & Label */}
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white border border-white/25 shadow-xs mb-1 mt-2">
            <IconComponent className="w-5 h-5 text-white stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-black tracking-wider uppercase text-white drop-shadow-xs">
            {theme.tag}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug line-clamp-1">
          {item.name}
        </h3>

        {/* Code & Stock Info */}
        <div className="flex items-center justify-between gap-1.5 mt-1.5 text-xs">
          {item.code ? (
            <span className="font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200/60">
              {item.code}
            </span>
          ) : item.barcode && !hasVariants ? (
            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 truncate max-w-[100px]">
              <Barcode className="w-3 h-3 text-slate-400 shrink-0" />
              {item.barcode}
            </span>
          ) : (
            <span />
          )}

          <span className="font-normal text-slate-500 text-xs shrink-0">
            Stok: <strong className="text-slate-900 font-bold">{totalStock} {unitSymbol}</strong>
          </span>
        </div>
      </div>

      {/* Price & Action Button Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <div className="min-w-0">
          {(hasVariants || hasMultipleSaleUnits) && isPriceStarting && (
            <span className="text-[10px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">
              Mulai
            </span>
          )}
          <div className="flex items-baseline truncate">
            <span className="text-xs font-bold text-slate-900 font-mono mr-1">Rp</span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 font-mono leading-none">
              {displayPrice.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-slate-400 font-normal ml-1">
              /{unitSymbol}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ml-2 transition-all ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-300'
              : 'bg-slate-100 text-slate-800 group-hover:bg-slate-900 group-hover:text-white shadow-xs active:scale-95'
          }`}
        >
          {hasVariants || hasMultipleSaleUnits ? (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
