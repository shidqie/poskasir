import React from 'react';
import { formatRupiah } from '@/utils/formatters';

export function VariantPrice({
  price,
  minPrice,
  isRange = false,
  unit = 'Pcs',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const displayPrice = isRange ? minPrice : price;

  return (
    <div className={`flex items-baseline gap-1 ${className}`}>
      {isRange && (
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          Mulai
        </span>
      )}
      <span className={`font-black text-slate-900 font-mono ${sizeClasses[size]}`}>
        {formatRupiah(displayPrice)}
      </span>
      {unit && (
        <span className="text-xs text-slate-500 font-medium">
          /{unit}
        </span>
      )}
    </div>
  );
}

export default VariantPrice;
