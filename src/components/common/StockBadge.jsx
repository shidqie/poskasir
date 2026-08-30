import React from 'react';

export function StockBadge({ stock = 0, minimumStock = 0, unitSymbol = '', className = '' }) {
  const numStock = Number(stock) || 0;
  const numMin = Number(minimumStock) || 0;

  let label = 'Tersedia';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (numStock <= 0) {
    label = 'Habis';
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
  } else if (numMin > 0 && numStock <= numMin) {
    label = 'Menipis';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  }

  // Format decimal / integer display
  const formattedStock = numStock % 1 === 0 ? numStock : numStock.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="font-semibold text-slate-900 text-sm">
        {formattedStock} {unitSymbol}
      </span>
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        {label}
      </span>
    </div>
  );
}

export default StockBadge;
