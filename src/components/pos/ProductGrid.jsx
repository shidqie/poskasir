import React from 'react';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/common/Button';
import { Package, AlertCircle, Plus } from 'lucide-react';

export function ProductGrid({
  items = [],
  isLoading = false,
  isError = false,
  errorMessage = '',
  searchTerm = '',
  onAddToCart,
  onOpenVariants,
  onOpenSaleUnits,
  onRetry,
  onOpenUnregModal,
}) {
  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <LoadingSpinner size="md" message="Memuat katalog barang kasir..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center bg-white rounded-2xl border border-red-200">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
          Gagal Memuat Data Produk
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {errorMessage || 'Periksa koneksi internet Anda atau coba kembali.'}
        </p>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Package className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
            {searchTerm
              ? `Barang "${searchTerm}" Tidak Ditemukan`
              : 'Belum Ada Data Barang'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
            {searchTerm
              ? 'Barang ini belum terdaftar di sistem. Anda dapat langsung mencatat harganya agar masuk transaksi.'
              : 'Tambahkan produk melalui Master Data atau catat harga barang baru.'}
          </p>
        </div>

        {searchTerm && onOpenUnregModal && (
          <div className="pt-1.5">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onOpenUnregModal}
              className="text-xs py-1.5 px-3"
            >
              + Catat Harga "{searchTerm}"
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 sm:gap-3">
      {items.map((item) => (
        <ProductCard
          key={`${item.sourceType}-${item.id}`}
          item={item}
          onAddToCart={onAddToCart}
          onOpenVariants={onOpenVariants}
          onOpenSaleUnits={onOpenSaleUnits}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
