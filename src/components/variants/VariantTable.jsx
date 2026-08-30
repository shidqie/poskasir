import React from 'react';
import { formatRupiah } from '@/utils/formatters';
import { StockBadge } from '@/components/common/StockBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Barcode, Edit2, History } from 'lucide-react';

export function VariantTable({
  variants = [],
  unitSymbol = 'Pcs',
  onEditVariant,
  onViewPriceHistory,
}) {
  if (variants.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Belum ada varian produk yang ditambahkan.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider">
          <tr>
            <th className="px-5 py-3.5">Nama Varian & Kode</th>
            <th className="px-4 py-3.5">Barcode</th>
            <th className="px-4 py-3.5 text-right">Harga Jual</th>
            <th className="px-4 py-3.5 text-center">Stok</th>
            <th className="px-4 py-3.5 text-center">Min. Stok</th>
            <th className="px-4 py-3.5 text-center">Status</th>
            {(onEditVariant || onViewPriceHistory) && (
              <th className="px-5 py-3.5 text-right">Aksi</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {variants.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-5 py-4">
                <p className="font-bold text-slate-900">{v.variant_name}</p>
                <span className="font-mono text-xs text-slate-500 font-semibold">
                  {v.code}
                </span>
              </td>
              <td className="px-4 py-4 text-xs font-mono text-slate-600">
                {v.barcode ? (
                  <span className="flex items-center gap-1">
                    <Barcode className="w-3.5 h-3.5 text-slate-400" />
                    {v.barcode}
                  </span>
                ) : (
                  <span className="italic text-slate-400">Tanpa barcode</span>
                )}
              </td>
              <td className="px-4 py-4 text-right font-extrabold text-slate-900 font-mono">
                {formatRupiah(v.selling_price)}
              </td>
              <td className="px-4 py-4 text-center">
                <StockBadge
                  stock={v.stock}
                  minimumStock={v.minimum_stock}
                  unitSymbol={v.unit?.symbol || unitSymbol}
                />
              </td>
              <td className="px-4 py-4 text-center text-xs text-slate-600 font-mono">
                {v.minimum_stock}
              </td>
              <td className="px-4 py-4 text-center">
                <StatusBadge status={v.status} />
              </td>
              {(onEditVariant || onViewPriceHistory) && (
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onViewPriceHistory && (
                      <button
                        type="button"
                        onClick={() => onViewPriceHistory(v)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Lihat Riwayat Harga Varian"
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}
                    {onEditVariant && (
                      <button
                        type="button"
                        onClick={() => onEditVariant(v)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                        title="Edit Varian"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default VariantTable;
