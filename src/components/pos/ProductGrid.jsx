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
  onRetry,
  onOpenUnregModal,
}) {
  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <LoadingSpinner size="lg" message="Memuat katalog barang kasir..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h3 className="font-bold text-slate-900 text-base">
          Gagal Memuat Data Produk
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          {errorMessage || 'Periksa koneksi internet Anda atau coba kembali.'}
        </p>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={onRetry}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            {searchTerm
              ? `Barang "${searchTerm}" Tidak Ditemukan`
              : 'Belum Ada Data Barang'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {searchTerm
              ? 'Barang ini belum terdaftar di sistem. Anda dapat langsung mencatat harganya agar masuk transaksi.'
              : 'Tambahkan produk melalui Master Data atau catat harga barang baru.'}
          </p>
        </div>

        {searchTerm && onOpenUnregModal && (
          <div className="pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={onOpenUnregModal}
            >
              + Catat Harga "{searchTerm}"
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5">
      {items.map((item) => (
        <ProductCard
          key={`${item.sourceType}-${item.id}`}
          item={item}
          onAddToCart={onAddToCart}
          onOpenVariants={onOpenVariants}
        />
      ))}
    </div>
  );
}

export default ProductGrid;
