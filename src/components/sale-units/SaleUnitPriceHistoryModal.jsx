import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { saleUnitService } from '@/services/saleUnitService';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatRupiah, formatTanggalWaktu } from '@/utils/formatters';
import { History, TrendingUp, TrendingDown, Clock, User, AlertCircle } from 'lucide-react';

export function SaleUnitPriceHistoryModal({ isOpen, onClose, saleUnit }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['sale-unit-price-history', saleUnit?.id],
    queryFn: () => saleUnitService.getPriceHistory(saleUnit?.id),
    enabled: Boolean(isOpen && saleUnit?.id),
  });

  if (!saleUnit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Riwayat Harga: ${saleUnit.name}`}
      subtitle="Catatan jejak perubahan harga satuan penjualan dari waktu ke waktu"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-8 text-center flex justify-center">
            <LoadingSpinner size="sm" message="Memuat riwayat harga..." />
          </div>
        ) : history.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Belum Ada Riwayat Perubahan</p>
            <p className="text-[11px] text-slate-400">
              Harga saat ini: <strong>{formatRupiah(saleUnit.selling_price)}</strong>
            </p>
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {history.map((h, idx) => {
              const oldVal = h.old_price !== null ? Number(h.old_price) : null;
              const newVal = Number(h.new_price);
              const isIncrease = oldVal !== null && newVal > oldVal;
              const isDecrease = oldVal !== null && newVal < oldVal;

              return (
                <div
                  key={h.id || idx}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <Clock size={12} className="text-slate-400" />
                      <span>{formatTanggalWaktu(h.changed_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {oldVal !== null ? (
                        <>
                          <span className="font-mono text-slate-400 line-through text-[11px]">
                            {formatRupiah(oldVal)}
                          </span>
                          <span className="text-slate-300">→</span>
                          <span className="font-mono font-black text-slate-900 text-sm">
                            {formatRupiah(newVal)}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatRupiah(newVal)} (Harga Awal)
                        </span>
                      )}
                    </div>

                    {h.user?.full_name && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <User size={10} />
                        <span>Oleh: {h.user.full_name}</span>
                      </div>
                    )}
                  </div>

                  {oldVal !== null && (
                    <div className="shrink-0">
                      {isIncrease ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <TrendingUp size={11} />
                          Naik
                        </span>
                      ) : isDecrease ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <TrendingDown size={11} />
                          Turun
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          Tetap
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl font-bold">
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SaleUnitPriceHistoryModal;
