import React from 'react';
import { VariantCard } from './VariantCard';
import { AlertCircle } from 'lucide-react';

export function VariantSelector({
  product,
  variants = [],
  selectedVariantId,
  onSelectVariant,
  className = '',
}) {
  const activeVariants = (variants.length > 0 ? variants : product?.product_variants || []).filter(
    (v) => v.status !== false
  );

  if (activeVariants.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-sm">Tidak ada varian aktif tersedia</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {activeVariants.map((variant) => (
        <VariantCard
          key={variant.id}
          variant={variant}
          productName={product?.name}
          unitSymbol={variant.unit?.symbol || product?.unit?.symbol || 'Pcs'}
          isSelected={selectedVariantId === variant.id}
          onSelect={() => onSelectVariant && onSelectVariant(variant)}
        />
      ))}
    </div>
  );
}

export default VariantSelector;
