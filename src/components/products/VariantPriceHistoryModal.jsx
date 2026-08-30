import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { variantService } from '@/services/variantService';
import { Modal } from '@/components/common/Modal';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRupiah, formatTanggal } from '@/utils/formatters';
import { History, TrendingUp, TrendingDown, Clock, User } from 'lucide-react';

export function VariantPriceHistoryModal({ isOpen, onClose, variant }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['variant-price-history', variant?.id],
    queryFn: () => variantService.getVariantPriceHistory(variant?.id),
    enabled: Boolean(isOpen && variant?.id),
  });

  if (!isOpen || !variant) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Riwayat Harga Varian"
      subtitle={`Catatan perubahan harga jual untuk varian: ${variant.variant_name}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-12 text-center">
            <LoadingSpinner size="md" message="Memuat riwayat harga varian..." />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum Ada Riwayat Perubahan"
            description={`Harga varian ${variant.variant_name} saat ini ${formatRupiah(variant.selling_price)} dan belum pernah mengalami perubahan sejak dibuat.`}
          />
        ) : (
          <div className="space-y-3">
            {history.map((h) => {
              const isIncrease =
                h.old_price !== null && Number(h.new_price) > Number(h.old_price);
              const isDecrease =
                h.old_price !== null && Number(h.new_price) < Number(h.old_price);

              return (
                <div
                  key={h.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isIncrease
                            ? 'bg-emerald-50 text-emerald-600'
                            : isDecrease
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {isIncrease ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : isDecrease ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <History className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">
                          {h.old_price !== null
                            ? `Dari ${formatRupiah(h.old_price)} ke`
                            : 'Harga Awal:'}
                        </span>
                        <p className="font-extrabold text-sm text-slate-900 font-mono">
                          {formatRupiah(h.new_price)}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatTanggal(h.changed_at, 'HH:mm - DD MMM YYYY')}
                    </span>
                  </div>

                  {h.changer && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>
                        Diubah oleh:{' '}
                        <strong className="text-slate-700 font-semibold">
                          {h.changer.full_name}
                        </strong>{' '}
                        ({h.changer.role})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default VariantPriceHistoryModal;
