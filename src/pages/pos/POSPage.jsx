import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/posService';
import { categoryService } from '@/services/categoryService';
import { barcodeService } from '@/services/barcodeService';
import { unregisteredPriceService } from '@/services/unregisteredPriceService';
import { useCartStore } from '@/stores/cartStore';

// POS Components
import { POSHeader } from '@/components/pos/POSHeader';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { BarcodeNotFoundModal } from '@/components/pos/BarcodeNotFoundModal';
import { CheckoutPlaceholderModal } from '@/components/pos/CheckoutPlaceholderModal';
import { UnregisteredPriceModal } from '@/components/prices/UnregisteredPriceModal';
import { Toast } from '@/components/common/Toast';
import { formatRupiah } from '@/utils/formatters';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export function POSPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isUnregModalOpen, setIsUnregModalOpen] = useState(false);
  const [unregInitialData, setUnregInitialData] = useState(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');
  const [isNotFoundModalOpen, setIsNotFoundModalOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Cart Zustand Store
  const {
    items,
    totalQuantity,
    totalAmount,
    addItem,
    isMobileCartOpen,
    toggleMobileCart,
  } = useCartStore();

  // Query Kategori
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
  });

  // Query Produk POS (Dioptimalkan dengan TanStack Query)
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['pos-products', { search: searchTerm, categoryId: selectedCategoryId }],
    queryFn: () => {
      if (searchTerm.trim()) {
        return posService.searchPOSUnified(searchTerm);
      }
      return posService.getPOSProducts({
        search: searchTerm,
        categoryId: selectedCategoryId,
      });
    },
    staleTime: 1000 * 60 * 2, // cache 2 menit
  });

  // Mutation Tambah Harga Sementara langsung dari POS
  const addUnregMutation = useMutation({
    mutationFn: (data) => unregisteredPriceService.createUnregisteredPrice(data),
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });

      // Langsung masukkan ke keranjang
      addItem({
        id: savedItem.id,
        name: savedItem.name,
        price: Number(savedItem.selling_price) || 0,
        unit: savedItem.unit_name || 'Item',
        unit_name: savedItem.unit_name || 'Item',
        barcode: savedItem.barcode,
        allowDecimal: false,
        sourceType: 'temporary',
      });

      setToast({
        isOpen: true,
        message: `Harga "${savedItem.name}" berhasil dicatat & masuk keranjang!`,
        type: 'success',
      });
    },
  });

  // Handler Tambah ke Keranjang dari klik Card
  const handleAddToCart = (product) => {
    const res = addItem(product);
    if (res?.success) {
      // Feedback getaran ringan jika di HP
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  };

  // Handler Hasil Scan Barcode Kamera
  const handleScanSuccess = async (barcodeText) => {
    try {
      const result = await barcodeService.lookupBarcode(barcodeText);

      if (result.found) {
        // Produk resmi atau harga sementara ditemukan
        addItem(result.data, 1);
        setToast({
          isOpen: true,
          message: `${result.data.name} dimasukkan ke keranjang.`,
          type: 'success',
        });
      } else {
        // Barcode belum ada di database
        setNotFoundBarcode(barcodeText);
        setIsNotFoundModalOpen(true);
      }
    } catch (err) {
      console.error('[POSPage] Error handling barcode:', err);
    }
  };

  // Handler Buka Modal Catat Harga Sementara dengan data terisi
  const handleOpenAddUnreg = (prefilled = {}) => {
    setUnregInitialData(prefilled);
    setIsUnregModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-screen bg-slate-100 overflow-hidden">
      {/* Header Terminal Kasir */}
      <POSHeader onOpenScanner={() => setIsScannerOpen(true)} />

      {/* Main Layout 2 Kolom (Desktop) / 1 Kolom (Mobile) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kolom Kiri: Katalog & Pencarian (65% di Desktop) */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
          {/* Baris Pencarian & Filter */}
          <div className="space-y-2.5">
            <ProductSearch
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onClear={() => setSearchTerm('')}
            />

            <CategoryFilter
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={(catId) => setSelectedCategoryId(catId)}
            />
          </div>

          {/* Grid Katalog Produk */}
          <div className="flex-1 pb-20 lg:pb-4">
            <ProductGrid
              items={products}
              isLoading={isLoading}
              isError={isError}
              errorMessage={error?.message}
              searchTerm={searchTerm}
              onAddToCart={handleAddToCart}
              onRetry={() => refetch()}
              onOpenUnregModal={() => handleOpenAddUnreg({ name: searchTerm })}
            />
          </div>
        </div>

        {/* Kolom Kanan: Panel Keranjang Belanja Desktop (35% di Desktop) */}
        <div className="hidden lg:flex w-96 xl:w-[420px] border-l border-slate-200/90 bg-white shrink-0 flex-col h-full shadow-lg z-10">
          <CartPanel onCheckout={() => setIsCheckoutOpen(true)} />
        </div>
      </div>

      {/* Mobile Floating Cart Bar (Muncul jika ada item di HP) */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium">Total Belanja:</p>
          <p className="text-lg font-black text-blue-600 font-mono leading-none mt-0.5">
            {formatRupiah(totalAmount)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleMobileCart(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 active:scale-95 transition-all"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Keranjang ({totalQuantity})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl max-h-[85vh] h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200">
            <CartPanel
              isMobile={true}
              onCloseMobile={() => toggleMobileCart(false)}
              onCheckout={() => {
                toggleMobileCart(false);
                setIsCheckoutOpen(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Scanner Barcode Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        onManualSearch={() => {
          setIsScannerOpen(false);
        }}
      />

      {/* Modal Barcode Tidak Ditemukan */}
      <BarcodeNotFoundModal
        isOpen={isNotFoundModalOpen}
        onClose={() => setIsNotFoundModalOpen(false)}
        scannedBarcode={notFoundBarcode}
        onAddTemporaryPrice={(barcode) => {
          handleOpenAddUnreg({ barcode });
        }}
        onSearchByName={() => {
          setSearchTerm('');
        }}
      />

      {/* Modal Tambah Harga Sementara */}
      <UnregisteredPriceModal
        isOpen={isUnregModalOpen}
        onClose={() => setIsUnregModalOpen(false)}
        initialData={unregInitialData}
        onSubmit={(data) => addUnregMutation.mutateAsync(data)}
        isLoading={addUnregMutation.isPending}
      />

      {/* Modal Placeholder Checkout (Tahap 3 Selesai) */}
      <CheckoutPlaceholderModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        totalAmount={totalAmount}
        totalQuantity={totalQuantity}
        itemsCount={items.length}
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

export default POSPage;
