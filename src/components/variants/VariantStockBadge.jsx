import React from 'react';
import { StockBadge } from '@/components/common/StockBadge';

export function VariantStockBadge({
  stock,
  minimumStock = 0,
  unitSymbol = 'Pcs',
  className = '',
}) {
  return (
    <StockBadge
      stock={stock}
      minimumStock={minimumStock}
      unitSymbol={unitSymbol}
      className={className}
    />
  );
}

export default VariantStockBadge;
