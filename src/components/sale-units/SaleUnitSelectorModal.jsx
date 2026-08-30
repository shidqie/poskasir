import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { formatRupiah } from '@/utils/formatters';
import {
  Scale,
  Package,
  Layers,
  Check,
  Plus,
  AlertCircle,
  Star,
  Barcode,
} from 'lucide-react';

export function SaleUnitSelectorModal({
  isOpen,
  onClose,
  product,
  variant = null,
  saleUnits = [],
  onSelectUnit,
}) {
  if (!isOpen || !product) return null;

  const isVariant = Boolean(variant);
  const baseStock = isVariant ? Number(variant.stock || 0) : Number(product.stock || 0);
  const baseUnitSymbol = isVariant
    ? (variant.unit?.symbol || product.unit?.symbol || 'Pcs')
    : (product.unit?.symbol || 'Pcs');

  const pName = product.name;
  const vName = isVariant ? variant.variant_name : null;
  const title = vName ? `${pName} - ${vName}` : pName;

  // Satuan aktif yang siap dipilih
  const activeUnits = (saleUnits || []).filter((su) => su.status !== false);

  const handleSelect = (su) => {
    const conv = Number(su.conversion_qty || 1);
    if (baseStock < conv) return;

    onSelectUnit({
      product,
      variant,
      saleUnit: su,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Pilih satuan penjualan (Sisa stok: ${baseStock} ${baseUnitSymbol})`}
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        {/* Info Sisa Stok Dasar */}
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Stok Dasar Tersedia:</span>
          <span className="font-bold text-slate-900 font-mono">
            {baseStock} {baseUnitSymbol}
          </span>
        </div>

        {/* List Pilihan Satuan */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {activeUnits.length === 0 ? (
            <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-bold text-sm text-slate-700">Tidak ada pilihan satuan aktif</p>
              <p className="text-xs text-slate-400 mt-1">
                Produk akan menggunakan harga bawaan dasar.
              </p>
            </div>
          ) : (
            activeUnits.map((su) => {
              const conv = Number(su.conversion_qty || 1);
              const isStockInsufficient = baseStock < conv;

              return (
                <div
                  key={su.id}
                  onClick={() => handleSelect(su)}
                  role="button"
                  tabIndex={isStockInsufficient ? -1 : 0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isStockInsufficient) {
                      e.preventDefault();
                      handleSelect(su);
                    }
                  }}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 ${
                    isStockInsufficient
                      ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed select-none'
                      : 'bg-white border-slate-200/90 hover:border-red-500 hover:shadow-md active:scale-[0.99] cursor-pointer group'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-red-600 transition-colors">
                        {su.name}
                      </h4>
                      {su.is_default && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                          Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="font-mono font-medium text-slate-600">
                        Isi: <strong>{su.conversion_qty} {baseUnitSymbol}</strong>
                      </span>
                      {su.barcode && (
                        <span className="flex items-center gap-0.5 font-mono text-[10px] text-slate-400">
                          <Barcode className="w-3 h-3" />
                          {su.barcode}
                        </span>
                      )}
                    </div>

                    {isStockInsufficient && (
                      <p className="text-[10px] font-bold text-rose-600 mt-1">
                        Stok tidak cukup (butuh {conv} {baseUnitSymbol})
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2.5">
                    <div>
                      <p className="font-black text-base sm:text-lg text-slate-900 font-mono leading-tight">
                        {formatRupiah(su.selling_price)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        /{su.name}
                      </p>
                    </div>

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                        isStockInsufficient
                          ? 'bg-slate-100 text-slate-300'
                          : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white shadow-xs'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl font-bold">
            Batal
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SaleUnitSelectorModal;
