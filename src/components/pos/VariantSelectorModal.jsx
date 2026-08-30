import React from 'react';
import { Modal } from '@/components/common/Modal';
import { StockBadge } from '@/components/common/StockBadge';
import { formatRupiah } from '@/utils/formatters';
import { Layers, Plus, Check, Barcode, AlertCircle, Scale, ChevronRight } from 'lucide-react';

export function VariantSelectorModal({
  isOpen,
  onClose,
  product,
  onSelectVariant,
}) {
  if (!isOpen || !product) return null;

  const variants = product.product_variants || [];
  const activeVariants = variants.filter((v) => v.status !== false);

  const handleSelect = (variant) => {
    if (Number(variant.stock) <= 0) return;
    onSelectVariant(product, variant, variant.sale_units || []);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      subtitle={`Pilih salah satu varian dari ${activeVariants.length} pilihan tersedia`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {activeVariants.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-sm">Tidak ada varian aktif</p>
            <p className="text-xs text-slate-400 mt-1">
              Hubungi Pemilik untuk mengaktifkan varian produk ini.
            </p>
          </div>
        ) : (
          activeVariants.map((variant) => {
            const isOutOfStock = Number(variant.stock) <= 0;
            const unitSymbol =
              variant.unit?.symbol || product.unit?.symbol || 'Pcs';
            const saleUnits = variant.sale_units || [];
            const hasMultiSaleUnits = saleUnits.length > 1;

            let displayPrice = Number(variant.selling_price || 0);
            if (hasMultiSaleUnits) {
              const prices = saleUnits.map((s) => Number(s.selling_price) || 0);
              displayPrice = prices.length > 0 ? Math.min(...prices) : displayPrice;
            } else if (saleUnits.length === 1) {
              displayPrice = Number(saleUnits[0].selling_price) || displayPrice;
            }

            return (
              <div
                key={variant.id}
                onClick={() => handleSelect(variant)}
                role="button"
                tabIndex={isOutOfStock ? -1 : 0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !isOutOfStock) {
                    e.preventDefault();
                    handleSelect(variant);
                  }
                }}
                className={`w-full p-4 rounded-xl border transition-all text-left flex items-center justify-between gap-3 ${
                  isOutOfStock
                    ? 'bg-slate-50/80 border-slate-200 opacity-60 cursor-not-allowed select-none'
                    : 'bg-white border-slate-200/90 hover:border-red-500 hover:shadow-md active:scale-[0.99] cursor-pointer group'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 transition-colors">
                      {variant.variant_name}
                    </h4>
                    <StockBadge
                      stock={variant.stock}
                      minimumStock={variant.minimum_stock}
                      unitSymbol={unitSymbol}
                    />
                    {hasMultiSaleUnits && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        <Scale className="w-2.5 h-2.5" />
                        {saleUnits.length} Satuan
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="font-mono text-slate-600 font-semibold">
                      {variant.code}
                    </span>
                    {variant.barcode && (
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Barcode className="w-3.5 h-3.5" />
                        {variant.barcode}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    {hasMultiSaleUnits && (
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase leading-none mb-0.5">
                        Mulai
                      </span>
                    )}
                    <p className="font-black text-base sm:text-lg text-slate-900 font-mono leading-none">
                      {formatRupiah(displayPrice)}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      /{unitSymbol}
                    </p>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-300'
                        : hasMultiSaleUnits
                        ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white shadow-xs'
                        : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
                    }`}
                  >
                    {hasMultiSaleUnits ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
}

export default VariantSelectorModal;
