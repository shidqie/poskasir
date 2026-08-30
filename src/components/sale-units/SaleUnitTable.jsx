import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { saleUnitService } from '@/services/saleUnitService';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatRupiah } from '@/utils/formatters';
import { SaleUnitFormModal } from '@/components/sale-units/SaleUnitFormModal';
import { SaleUnitPriceHistoryModal } from '@/components/sale-units/SaleUnitPriceHistoryModal';
import {
  Plus,
  Edit2,
  Trash2,
  Barcode,
  History,
  CheckCircle2,
  Star,
  Layers,
  Scale,
  Package,
} from 'lucide-react';

export function SaleUnitTable({
  productId,
  variantId = null,
  baseUnitSymbol = 'Pcs',
  basePrice = 0,
  productName = '',
}) {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [historyUnit, setHistoryUnit] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const queryKey = ['sale-units', { productId, variantId }];

  const { data: saleUnits = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => saleUnitService.getSaleUnitsByProduct(productId, variantId),
    enabled: Boolean(productId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => saleUnitService.deleteSaleUnit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
    },
  });

  const handleOpenCreate = () => {
    setSelectedUnit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setSelectedUnit(unit);
    setIsFormOpen(true);
  };

  const handleOpenHistory = (unit) => {
    setHistoryUnit(unit);
    setIsHistoryOpen(true);
  };

  const handleDelete = (unit) => {
    if (window.confirm(`Hapus satuan penjualan "${unit.name}"?`)) {
      deleteMutation.mutate(unit.id);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-red-600" />
            <span>Pilihan Satuan & Harga Penjualan</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            Atur harga berbeda untuk penjualan eceran, renceng, setengah dus, atau dus (stok dasar tetap dihitung per {baseUnitSymbol}).
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenCreate}
          icon={Plus}
          className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 rounded-xl self-start sm:self-auto cursor-pointer"
        >
          Tambah Satuan Penjualan
        </Button>
      </div>

      {isLoading ? (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 flex justify-center">
          <LoadingSpinner size="sm" message="Memuat satuan penjualan..." />
        </div>
      ) : saleUnits.length === 0 ? (
        <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Hanya 1 Harga Standar ({baseUnitSymbol})</p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-0.5">
              Produk saat ini dijual dengan harga standar bawaan <strong>{formatRupiah(basePrice)}/{baseUnitSymbol}</strong>. Tambahkan satuan jika ingin menjual dalam bentuk Dus, Renceng, atau 1/2 Dus dengan harga khusus.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          {/* Mobile Card List View (< 768px) */}
          <div className="md:hidden divide-y divide-slate-100">
            {saleUnits.map((su) => (
              <div key={su.id} className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-slate-900">{su.name}</span>
                      {su.is_default && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      1 {su.name} = <strong className="text-slate-700 font-mono">{su.conversion_qty} {baseUnitSymbol}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-black text-red-600 text-sm">
                      {formatRupiah(su.selling_price)}
                    </span>
                    <div className="mt-1">
                      {su.status ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                          Nonaktif
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                  {su.barcode ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      {su.barcode}
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Tanpa barcode khusus</span>
                  )}

                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(su)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Riwayat Perubahan Harga"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(su)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Edit Satuan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(su)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus Satuan Penjualan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="px-3.5 py-2.5">Satuan Penjualan</th>
                  <th className="px-3.5 py-2.5">Konversi Stok</th>
                  <th className="px-3.5 py-2.5">Harga Jual</th>
                  <th className="px-3.5 py-2.5">Barcode</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {saleUnits.map((su) => (
                  <tr key={su.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">{su.name}</span>
                        {su.is_default && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                            Default
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span className="font-mono font-bold text-slate-800">
                        {su.conversion_qty} {baseUnitSymbol}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span className="font-mono font-black text-red-600 text-xs sm:text-sm">
                        {formatRupiah(su.selling_price)}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5">
                      {su.barcode ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          <Barcode className="w-3 h-3 text-slate-400" />
                          {su.barcode}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-center">
                      {su.status ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenHistory(su)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Riwayat Perubahan Harga"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(su)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Edit Satuan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(su)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Satuan Penjualan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Tambah/Edit Satuan Penjualan */}
      <SaleUnitFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productId={productId}
        variantId={variantId}
        baseUnitSymbol={baseUnitSymbol}
        saleUnit={selectedUnit}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey });
          queryClient.invalidateQueries({ queryKey: ['products'] });
          queryClient.invalidateQueries({ queryKey: ['pos-products'] });
        }}
      />

      {/* Modal Riwayat Harga Satuan */}
      <SaleUnitPriceHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        saleUnit={historyUnit}
      />
    </div>
  );
}

export default SaleUnitTable;
