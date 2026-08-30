import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceService } from '@/services/priceService';
import { unregisteredPriceService } from '@/services/unregisteredPriceService';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { UnregisteredPriceModal } from '@/components/prices/UnregisteredPriceModal';
import { ConvertToProductModal } from '@/pages/owner/unregistered/ConvertToProductModal';
import { formatRupiah } from '@/utils/formatters';
import {
  Tags,
  Search,
  Plus,
  Barcode,
  Package,
  Layers,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export function PriceListPage({ isOwnerView = false }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [convertModal, setConvertModal] = useState({ isOpen: false, item: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Query Pencarian Harga Terpadu
  const {
    data: items = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['prices', { search }],
    queryFn: () => priceService.searchAllPrices(search),
  });

  // Mutation Tambah Harga Sementara
  const addMutation = useMutation({
    mutationFn: (data) => unregisteredPriceService.createUnregisteredPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      setToast({
        isOpen: true,
        message: 'Harga barang berhasil dicatat ke Daftar Harga!',
        type: 'success',
      });
    },
  });

  // Mutation Konversi ke Data Barang Resmi
  const convertMutation = useMutation({
    mutationFn: ({ id, productData }) =>
      unregisteredPriceService.convertToProduct(id, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      setToast({
        isOpen: true,
        message: 'Barang berhasil didaftarkan ke Data Master Barang!',
        type: 'success',
      });
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Daftar & Cek Harga Barang
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Pencarian cepat harga barang toko sembako (produk terdaftar & catatan sementara)
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          icon={Plus}
          className="shrink-0"
        >
          + Tambah Harga Belum Terdaftar
        </Button>
      </div>

      {/* Prominent Search Bar */}
      <div className="relative shadow-xs rounded-2xl">
        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-6 h-6" />
        </div>
        <input
          type="text"
          placeholder="Ketik nama barang, kode, atau barcode (Contoh: Gula, Indomie, Beras, Aqua)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full pl-13 pr-4 py-4 text-base sm:text-lg font-medium bg-white border border-slate-300 rounded-2xl shadow-xs focus:outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all placeholder:text-slate-400 placeholder:text-sm sm:placeholder:text-base"
        />
      </div>

      {/* Hasil Pencarian */}
      <div>
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <span>
            {search ? (
              <>
                Hasil pencarian untuk "<strong className="text-slate-800">{search}</strong>":
              </>
            ) : (
              'Seluruh daftar harga barang aktif:'
            )}
          </span>
          <span className="font-semibold text-slate-900">{items.length} item ditemukan</span>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <LoadingSpinner size="lg" message="Mencari harga barang..." />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-red-600 bg-white rounded-2xl border border-red-200">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-semibold text-sm">Gagal memuat daftar harga</p>
            <p className="text-xs text-slate-500 mt-1">{error?.message || 'Silakan coba kembali'}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
              <HelpCircle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Harga Barang Tidak Ditemukan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Barang "{search}" belum terdaftar di sistem. Anda dapat langsung mencatat harganya agar tidak perlu bertanya lagi.
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="primary"
              icon={Plus}
            >
              Catat Harga "{search}" Sekarang
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const isRegistered = item.sourceType === 'registered';

              return (
                <div
                  key={`${item.sourceType}-${item.id}`}
                  className={`p-5 rounded-2xl border transition-all hover:shadow-md bg-white flex flex-col justify-between ${
                    isRegistered
                      ? 'border-slate-200/90 shadow-xs'
                      : 'border-amber-200/90 bg-amber-50/20 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Badge Tipe & Kategori */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 truncate">
                        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.categoryName}
                      </span>
                      <StatusBadge
                        status={isRegistered ? 'registered' : 'unregistered'}
                        type="registration"
                      />
                    </div>

                    {/* Nama Barang */}
                    <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">
                      {item.name}
                    </h3>

                    {/* Barcode & Kode jika ada */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-mono text-slate-500">
                      {item.code && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          {item.code}
                        </span>
                      )}
                      {item.barcode && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          {item.barcode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Harga & Satuan Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {formatRupiah(item.price)}
                      </span>
                      <span className="text-xs text-slate-500 font-medium ml-1">
                        / {item.unitSymbol}
                      </span>
                    </div>

                    {item.notes && (
                      <span className="text-[11px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded italic line-clamp-1 max-w-[120px]">
                        {item.notes}
                      </span>
                    )}
                  </div>

                  {/* Tombol Jadikan Data Barang Resmi (Khusus Pemilik) */}
                  {isOwnerView && !isRegistered && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Sparkles}
                        onClick={() =>
                          setConvertModal({
                            isOpen: true,
                            item: {
                              id: item.id,
                              name: item.name,
                              selling_price: item.price,
                              barcode: item.barcode,
                              unit_name: item.unitSymbol,
                            },
                          })
                        }
                        className="w-full text-xs py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-sm shadow-red-500/25 font-bold text-white"
                      >
                        Jadikan Data Barang Resmi
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Harga Sementara */}
      <UnregisteredPriceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={(data) => addMutation.mutateAsync(data)}
        initialData={search ? { name: search } : null}
        isLoading={addMutation.isPending}
      />

      {/* Modal Konversi ke Data Barang Resmi (Khusus Pemilik) */}
      <ConvertToProductModal
        isOpen={convertModal.isOpen}
        onClose={() => setConvertModal({ isOpen: false, item: null })}
        unregisteredItem={convertModal.item}
        onSubmit={(id, productData) =>
          convertMutation.mutateAsync({ id, productData })
        }
        isLoading={convertMutation.isPending}
      />

      {/* Toast Feedback */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

export default PriceListPage;
