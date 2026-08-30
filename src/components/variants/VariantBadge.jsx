import React from 'react';
import { Layers } from 'lucide-react';

export function VariantBadge({
  name,
  count,
  variant = 'primary', // 'primary' | 'secondary' | 'neutral'
  className = '',
}) {
  if (count !== undefined) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/80 ${className}`}
      >
        <Layers className="w-3 h-3 text-red-600 shrink-0" />
        <span>{count} Varian</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200/70 ${className}`}
    >
      <Layers className="w-3 h-3 text-red-600 shrink-0" />
      <span>{name}</span>
    </span>
  );
}

export default VariantBadge;
