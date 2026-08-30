import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { posService } from '@/services/posService';
import { categoryService } from '@/services/categoryService';
import { barcodeService } from '@/services/barcodeService';
import { unregisteredPriceService } from '@/services/unregisteredPriceService';
import { transactionService } from '@/services/transactionService';
import { useCartStore } from '@/stores/cartStore';

// POS Components
import { POSHeader } from '@/components/pos/POSHeader';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { BarcodeNotFoundModal } from '@/components/pos/BarcodeNotFoundModal';
import PaymentModal from '@/components/pos/PaymentModal';
import TransactionSuccessModal from '@/components/pos/TransactionSuccessModal';
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
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
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
    clearCart,
    isMobileCartOpen,
    toggleMobileCart,
  } = useCartStore();

  // Query Kategori
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoryService.getCategories({ onlyActive: true }),
  });

  // Query Produk POS
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
    staleTime: 1000 * 60 * 2,
  });

  // Mutation Tambah Harga Sementara
  const addUnregMutation = useMutation({
    mutationFn: (data) => unregisteredPriceService.createUnregisteredPrice(data),
    onSuccess: (savedItem) => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['prices'] });
      queryClient.invalidateQueries({ queryKey: ['unregistered-prices'] });

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

  // Mutation Checkout via RPC process_sale
  const checkoutMutation = useMutation({
    mutationFn: ({ paymentAmount, paymentMethod, idempotencyKey }) =>
      transactionService.processSale({
        items: items.map((item) => ({
          sourceType: item.sourceType || 'product',
          productId: item.sourceType !== 'temporary' ? item.id : null,
          temporaryPriceId: item.sourceType === 'temporary' ? item.id : null,
          name: item.name,
          quantity: Number(item.quantity),
        })),
        paymentAmount,
        paymentMethod,
        idempotencyKey,
      }),
    onSuccess: (data) => {
      // Clear cart & cache
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Tutup payment, buka success
      setIsPaymentOpen(false);
      setLastTransaction(data);
      setIsSuccessOpen(true);
    },
    onError: (err) => {
      setToast({
        isOpen: true,
        message: err.message || 'Transaksi gagal. Coba lagi.',
        type: 'error',
      });
    },
  });

  const handleOpenCheckout = useCallback(() => {
    if (items.length === 0) return;
    setIsPaymentOpen(true);
  }, [items.length]);

  const handleConfirmPayment = useCallback(
    ({ paymentMethod, paymentAmount }) => {
      const idempotencyKey = uuidv4();
      checkoutMutation.mutate({ paymentAmount, paymentMethod, idempotencyKey });
    },
    [checkoutMutation]
  );

  const handleNewTransaction = useCallback(() => {
    setIsSuccessOpen(false);
    setLastTransaction(null);
    toggleMobileCart(false);
  }, [toggleMobileCart]);

  const handleAddToCart = (product) => {
    const res = addItem(product);
    if (res?.success) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
    }
  };

  const handleScanSuccess = async (barcodeText) => {
    try {
      const result = await barcodeService.lookupBarcode(barcodeText);

      if (result.found) {
        addItem(result.data, 1);
        setToast({
          isOpen: true,
          message: `${result.data.name} dimasukkan ke keranjang.`,
          type: 'success',
        });
      } else {
        setNotFoundBarcode(barcodeText);
        setIsNotFoundModalOpen(true);
      }
    } catch (err) {
      console.error('[POSPage] Error handling barcode:', err);
    }
  };

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
        {/* Kolom Kiri: Katalog & Pencarian */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-5 overflow-y-auto space-y-3 sm:space-y-4">
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

        {/* Kolom Kanan: Panel Keranjang Desktop */}
        <div className="hidden lg:flex w-96 xl:w-[420px] border-l border-slate-200/90 bg-white shrink-0 flex-col h-full shadow-lg z-10">
          <CartPanel onCheckout={handleOpenCheckout} />
        </div>
      </div>

      {/* Mobile Floating Cart Bar */}
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
                handleOpenCheckout();
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
        onManualSearch={() => setIsScannerOpen(false)}
      />

      {/* Modal Barcode Tidak Ditemukan */}
      <BarcodeNotFoundModal
        isOpen={isNotFoundModalOpen}
        onClose={() => setIsNotFoundModalOpen(false)}
        scannedBarcode={notFoundBarcode}
        onAddTemporaryPrice={(barcode) => handleOpenAddUnreg({ barcode })}
        onSearchByName={() => setSearchTerm('')}
      />

      {/* Modal Tambah Harga Sementara */}
      <UnregisteredPriceModal
        isOpen={isUnregModalOpen}
        onClose={() => setIsUnregModalOpen(false)}
        initialData={unregInitialData}
        onSubmit={(data) => addUnregMutation.mutateAsync(data)}
        isLoading={addUnregMutation.isPending}
      />

      {/* Modal Pembayaran Aktif */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => !checkoutMutation.isPending && setIsPaymentOpen(false)}
        total={totalAmount}
        onConfirm={handleConfirmPayment}
        isProcessing={checkoutMutation.isPending}
      />

      {/* Modal Transaksi Berhasil */}
      <TransactionSuccessModal
        isOpen={isSuccessOpen}
        transaction={lastTransaction}
        onNewTransaction={handleNewTransaction}
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
