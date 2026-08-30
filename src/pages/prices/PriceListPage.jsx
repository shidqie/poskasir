import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { priceService } from '@/services/priceService';
import { unregisteredPriceService } from '@/services/unregisteredPriceService';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Toast } from '@/components/common/Toast';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { EmptyState } from '@/components/common/EmptyState';
import { Alert } from '@/components/common/Alert';
import { UnregisteredPriceModal } from '@/components/prices/UnregisteredPriceModal';
import { ConvertToProductModal } from '@/pages/owner/unregistered/ConvertToProductModal';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { formatRupiah } from '@/utils/formatters';
import { getProductCategoryTheme, getProductDummyImage } from '@/utils/dummyImages';
import {
  Tags,
  Search,
  Plus,
  Barcode,
  Layers,
  HelpCircle,
  Sparkles,
  Camera,
  X,
  Package,
} from 'lucide-react';

function PriceItemCard({ item, isOwnerView, onConvert }) {
  const [imgError, setImgError] = useState(false);
  const isRegistered = item.sourceType === 'registered';
  const categoryName = item.categoryName || 'Sembako';
  const theme = getProductCategoryTheme(item.name, categoryName);
  const IconComponent = theme.Icon;
  const imageUrl = item.image_url || getProductDummyImage(item.name, categoryName);

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 hover:shadow-md bg-white flex flex-col justify-between ${
        isRegistered
          ? 'border-slate-200/90 shadow-xs hover:border-red-300'
          : 'border-amber-200/90 bg-amber-50/20 shadow-xs hover:border-amber-400'
      }`}
    >
      <div>
        {/* Product Thumbnail & Overlay Badges */}
        <div
          className={`relative w-full h-24 sm:h-28 rounded-xl overflow-hidden mb-2 bg-gradient-to-br ${theme.bgGradient} flex items-center justify-center`}
        >
          {!imgError ? (
            <img
              src={imageUrl}
              alt={item.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white drop-shadow-xs">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-xs mb-1">
                <IconComponent className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                {theme.tag}
              </span>
            </div>
          )}

          {/* Top-Left Category Pill */}
          <div className="absolute top-1.5 left-1.5 max-w-[85px]">
            <span className="inline-block truncate px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-black/60 text-white backdrop-blur-xs shadow-xs">
              {categoryName}
            </span>
          </div>

          {/* Top-Right Status Badge */}
          <div className="absolute top-1.5 right-1.5">
            <StatusBadge
              status={isRegistered ? 'registered' : 'unregistered'}
              type="registration"
            />
          </div>
        </div>

        {/* Nama Barang */}
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-2">
          {item.name}
        </h3>

        {/* Barcode & Kode */}
        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] font-mono text-slate-500">
          {item.code && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[9px] border border-slate-200/80">
              {item.code}
            </span>
          )}
          {item.barcode && (
            <span className="flex items-center gap-0.5 text-slate-500 text-[9px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 truncate max-w-[110px]">
              <Barcode className="w-2.5 h-2.5 text-slate-400" />
              {item.barcode}
            </span>
          )}
        </div>
      </div>

      {/* Harga & Satuan Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-baseline justify-between">
        <div>
          <span className="text-sm sm:text-base font-black text-slate-900 font-mono">
            {formatRupiah(item.price)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium ml-1">
            /{item.unitSymbol || 'Pcs'}
          </span>
        </div>

        {item.notes && (
          <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium italic line-clamp-1 max-w-[90px]">
            {item.notes}
          </span>
        )}
      </div>

      {/* Tombol Jadikan Data Barang Resmi (Khusus Pemilik) */}
      {isOwnerView && !isRegistered && (
        <div className="mt-2.5 pt-2 border-t border-amber-200/60">
          <Button
            size="sm"
            variant="primary"
            icon={Sparkles}
            onClick={() => onConvert(item)}
            className="w-full text-[11px] py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 shadow-xs font-bold text-white rounded-xl"
          >
            Jadikan Data Barang Resmi
          </Button>
        </div>
      )}
    </div>
  );
}

export function PriceListPage({ isOwnerView = false }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
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
        message: 'Harga sementara berhasil dicatat.',
        type: 'success',
      });
      setIsAddModalOpen(false);
    },
  });

  // Mutation Konversi ke Data Barang
  const convertMutation = useMutation({
    mutationFn: (data) => unregisteredPriceService.convertToProduct(data.unregistered_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });
      setToast({
        isOpen: true,
        message: 'Barang berhasil didaftarkan ke Master Produk.',
        type: 'success',
      });
      setConvertModal({ isOpen: false, item: null });
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Daftar & Cek Harga' }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Daftar & Cek Harga Cepat
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Pencarian instan harga seluruh barang toko sembako untuk kemudahan Kasir & Pelanggan
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          variant="primary"
          icon={Plus}
          className="shrink-0 font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20 rounded-xl"
        >
          Tambah Harga Belum Terdaftar
        </Button>
      </div>

      {/* Clean Minimalist Search Bar with Scanner */}
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Ketik nama barang, kode, atau barcode (Contoh: Gula, Indomie, Aqua)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-28 py-3.5 sm:py-4 text-sm sm:text-base font-medium bg-white border border-slate-300/90 rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400"
        />

        {/* Right Actions: Clear & Camera Scanner */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Scan Barcode via Kamera"
          >
            <Camera className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>
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
          <div className="p-6">
            <Alert variant="danger" title="Gagal Memuat Daftar Harga">
              {error?.message || 'Silakan coba beberapa saat lagi.'}
            </Alert>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="Harga Barang Tidak Ditemukan"
            description={
              search
                ? `Barang "${search}" belum terdaftar di sistem. Anda dapat langsung mencatat harganya agar tidak perlu bertanya lagi.`
                : 'Belum ada data barang atau harga yang tercatat di sistem.'
            }
            actionLabel={search ? `Catat Harga "${search}" Sekarang` : 'Tambah Catatan Harga'}
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => (
              <PriceItemCard
                key={`${item.sourceType}-${item.id}-${item.variantId || 'main'}`}
                item={item}
                isOwnerView={isOwnerView}
                onConvert={(it) =>
                  setConvertModal({
                    isOpen: true,
                    item: {
                      id: it.id,
                      name: it.name,
                      selling_price: it.price,
                      barcode: it.barcode,
                      unit_name: it.unitSymbol,
                    },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Scanner Barcode */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setSearch(code);
          setIsScannerOpen(false);
        }}
        onManualSearch={() => setIsScannerOpen(false)}
      />

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
