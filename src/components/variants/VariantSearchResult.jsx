import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { Layers, Barcode, ChevronRight } from 'lucide-react';

export function VariantSearchResult({
  item,
  onSelect,
}) {
  const isOutOfStock = Number(item.stock) <= 0;

  return (
    <div
      onClick={() => !isOutOfStock && onSelect && onSelect(item)}
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
        isOutOfStock
          ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
          : 'bg-white border-slate-200 hover:border-red-400 hover:bg-red-50/20 active:scale-[0.99] cursor-pointer'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="font-bold text-sm text-slate-900 leading-tight">
            {item.productName || item.name}
          </h4>
          {item.variantName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              <Layers className="w-3 h-3 text-red-600" />
              {item.variantName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
          {item.code && <span className="font-semibold text-slate-700">{item.code}</span>}
          {item.barcode && (
            <span className="flex items-center gap-0.5 text-slate-400">
              <Barcode className="w-3 h-3" />
              {item.barcode}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <p className="font-black text-sm text-slate-900 font-mono">
            {formatRupiah(item.price || item.selling_price)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            /{item.unitSymbol || item.unit?.symbol || 'Pcs'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}

export default VariantSearchResult;
