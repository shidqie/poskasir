import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { posService } from '@/services/posService';
import { categoryService } from '@/services/categoryService';
import { barcodeService } from '@/services/barcodeService';
import { transactionService } from '@/services/transactionService';
import { cashierSessionService } from '@/services/cashierSessionService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';

// POS Components
import { POSHeader } from '@/components/pos/POSHeader';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { CategoryFilter } from '@/components/pos/CategoryFilter';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartPanel } from '@/components/pos/CartPanel';
import { BarcodeScannerModal } from '@/components/pos/BarcodeScannerModal';
import { BarcodeNotFoundModal } from '@/components/pos/BarcodeNotFoundModal';
import { VariantSelectorModal } from '@/components/pos/VariantSelectorModal';
import { SaleUnitSelectorModal } from '@/components/sale-units/SaleUnitSelectorModal';
import PaymentModal from '@/components/pos/PaymentModal';
import TransactionSuccessModal from '@/components/pos/TransactionSuccessModal';
import { ProductSubmissionModal } from '@/components/submissions/ProductSubmissionModal';
import { OpenCashierModal } from '@/components/cashier/OpenCashierModal';
import { CashMovementModal } from '@/components/cashier/CashMovementModal';
import { Toast } from '@/components/common/Toast';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { formatRupiah } from '@/utils/formatters';
import { ShoppingCart, ArrowRight, DoorClosed, DoorOpen, Lock, ShieldAlert } from 'lucide-react';

export function POSPage() {
  const queryClient = useQueryClient();
  const { profile, role } = useAuthStore();
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
  const [variantModalProduct, setVariantModalProduct] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [saleUnitModalState, setSaleUnitModalState] = useState({
    isOpen: false,
    product: null,
    variant: null,
    saleUnits: [],
  });
  const [isOpenCashierOpen, setIsOpenCashierOpen] = useState(false);
  const [cashMovementModalState, setCashMovementModalState] = useState({
    isOpen: false,
    type: 'cash_out',
  });
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

  // Query Sesi Kasir Aktif
  const {
    data: activeSession,
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ['active-cashier-session', profile?.id],
    queryFn: () => cashierSessionService.getActiveSession(profile?.id),
    refetchInterval: 10000,
  });

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
    enabled: Boolean(activeSession && activeSession.status === 'open') || role === 'owner',
  });

  // Mutation Checkout via RPC process_sale
  const checkoutMutation = useMutation({
    mutationFn: ({ paymentAmount, paymentMethod, customerId, idempotencyKey }) =>
      transactionService.processSale({
        items: items.map((item) => ({
          sourceType: item.sourceType || 'product',
          productId: item.productId || (item.sourceType !== 'temporary' ? item.id : null),
          variantId: item.variantId || null,
          temporaryPriceId: item.temporaryPriceId || (item.sourceType === 'temporary' ? item.id : null),
          name: item.productName || item.name,
          variantName: item.variantName || null,
          displayName: item.displayName || item.name,
          quantity: Number(item.quantity),
        })),
        paymentAmount,
        paymentMethod,
        customerId,
        idempotencyKey,
      }),
    onSuccess: (data) => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['active-cashier-session'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-debt'] });
      queryClient.invalidateQueries({ queryKey: ['debt-global-summary'] });

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
    ({ paymentMethod, paymentAmount, customerId }) => {
      const idempotencyKey = uuidv4();
      checkoutMutation.mutate({ paymentAmount, paymentMethod, customerId, idempotencyKey });
    },
    [checkoutMutation]
  );

  const handleNewTransaction = useCallback(() => {
    setIsSuccessOpen(false);
    setLastTransaction(null);
    clearCart();
  }, [clearCart]);

  const handleOpenSaleUnits = useCallback((product, variant = null, customSaleUnits = null) => {
    const suList = customSaleUnits || (variant ? (variant.sale_units || []) : (product.sale_units || []));
    setSaleUnitModalState({
      isOpen: true,
      product,
      variant,
      saleUnits: suList,
    });
  }, []);

  const handleSelectSaleUnit = useCallback(({ product, variant, saleUnit }) => {
    const isVariant = Boolean(variant);
    const pName = product.name;
    const vName = isVariant ? variant.variant_name : null;
    const suName = saleUnit ? saleUnit.name : null;

    let displayName = pName;
    if (vName) displayName += ` - ${vName}`;
    if (suName) displayName += ` (${suName})`;

    const unitPrice = saleUnit ? Number(saleUnit.selling_price) : (isVariant ? Number(variant.selling_price) : Number(product.selling_price));
    const convQty = saleUnit ? Number(saleUnit.conversion_qty) : 1;
    const baseStock = isVariant ? Number(variant.stock) : Number(product.stock);
    const minStock = isVariant ? Number(variant.minimum_stock) : Number(product.minimum_stock);
    const baseCode = isVariant ? (variant.code || product.code) : product.code;
    const baseBarcode = saleUnit?.barcode || (isVariant ? variant.barcode : product.barcode);
    const unitObj = isVariant ? (variant.unit || product.unit) : product.unit;

    const res = addItem({
      sourceType: 'product',
      productId: product.id,
      variantId: isVariant ? variant.id : null,
      saleUnitId: saleUnit ? saleUnit.id : null,
      saleUnitName: suName,
      conversionQty: convQty,
      name: pName,
      productName: pName,
      variantName: vName,
      displayName,
      selling_price: unitPrice,
      price: unitPrice,
      stock: baseStock,
      minimum_stock: minStock,
      code: baseCode,
      barcode: baseBarcode,
      unit: unitObj,
      allowDecimal: Boolean(unitObj?.allow_decimal),
    });

    if (res?.success) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(30);
      }
      setToast({
        isOpen: true,
        message: `${displayName} dimasukkan ke keranjang.`,
        type: 'success',
      });
    }
  }, [addItem]);

  const handleAddToCart = useCallback((product) => {
    const saleUnits = product.sale_units || [];
    if (saleUnits.length > 1) {
      handleOpenSaleUnits(product);
    } else if (saleUnits.length === 1) {
      handleSelectSaleUnit({ product, variant: null, saleUnit: saleUnits[0] });
    } else {
      const res = addItem(product);
      if (res?.success) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(30);
        }
      }
    }
  }, [addItem, handleOpenSaleUnits, handleSelectSaleUnit]);

  const handleOpenVariants = useCallback((product) => {
    setVariantModalProduct(product);
    setIsVariantModalOpen(true);
  }, []);

  const handleSelectVariant = useCallback((product, variant, saleUnits = []) => {
    const suList = saleUnits && saleUnits.length > 0 ? saleUnits : (variant.sale_units || []);
    if (suList.length > 1) {
      handleOpenSaleUnits(product, variant, suList);
    } else if (suList.length === 1) {
      handleSelectSaleUnit({ product, variant, saleUnit: suList[0] });
    } else {
      const res = addItem({
        sourceType: 'product',
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        productName: product.name,
        variantName: variant.variant_name,
        displayName: `${product.name} - ${variant.variant_name}`,
        selling_price: variant.selling_price,
        stock: variant.stock,
        minimum_stock: variant.minimum_stock,
        code: variant.code,
        barcode: variant.barcode,
        unit: variant.unit || product.unit,
        allowDecimal: Boolean(
          variant.unit?.allow_decimal || product.unit?.allow_decimal
        ),
      });

      if (res?.success) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(30);
        }
        setToast({
          isOpen: true,
          message: `${product.name} (${variant.variant_name}) dimasukkan ke keranjang.`,
          type: 'success',
        });
      }
    }
  }, [addItem, handleOpenSaleUnits, handleSelectSaleUnit]);

  const isSessionOpen = activeSession && activeSession.status === 'open';

  const handleScanSuccess = useCallback(
    async (barcodeText) => {
      if (!barcodeText || !barcodeText.trim()) return;
      const clean = barcodeText.trim();
      setIsScannerOpen(false);

      try {
        const result = await barcodeService.lookupBarcode(clean);

        if (result.found && result.data) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(40);
          }

          // Jika produk memiliki banyak varian dan belum dipilih varian spesifik
          if (
            result.data.has_variants &&
            result.data.product_variants?.length > 0 &&
            !result.data.variantId
          ) {
            handleOpenVariants(result.data);
          } else if (!result.data.saleUnitId && result.data.sale_units?.length > 1) {
            // Jika produk memiliki banyak pilihan satuan penjualan dan scan dari barcode umum produk
            handleOpenSaleUnits(result.data);
          } else {
            const addRes = addItem(result.data, 1);
            if (addRes?.success !== false) {
              setToast({
                isOpen: true,
                message: `${result.data.displayName || result.data.name} dimasukkan ke keranjang.`,
                type: 'success',
              });
            } else {
              setToast({
                isOpen: true,
                message: addRes?.message || 'Stok tidak mencukupi untuk item ini.',
                type: 'warning',
              });
            }
          }
          setSearchTerm('');
        } else {
          setNotFoundBarcode(clean);
          setIsNotFoundModalOpen(true);
        }
      } catch (err) {
        console.error('[POSPage] Error handling barcode:', err);
        setToast({
          isOpen: true,
          message: 'Terjadi kesalahan saat memproses barcode.',
          type: 'danger',
        });
      }
    },
    [addItem, handleOpenVariants, handleOpenSaleUnits]
  );

  // Pasang listener global untuk hardware scanner (USB / Bluetooth / Keyboard Wedge)
  useBarcodeScanner(handleScanSuccess, {
    disabled: !isSessionOpen && role !== 'owner',
  });

  const handleOpenAddUnreg = (prefilled = {}) => {
    setUnregInitialData(prefilled);
    setIsUnregModalOpen(true);
  };

  // =========================================================================
  // VIEW: KASIR TERKUNCI (BELUM BUKA KASIR ATAU SESI SUDAH DITUTUP)
  // =========================================================================
  if (!isSessionLoading && !isSessionOpen) {
    return (
      <div className="flex flex-col h-[calc(100vh-60px)] md:h-screen bg-slate-100 items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-600 mx-auto shadow-inner">
            <DoorClosed className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kasir Belum Dibuka
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Silakan buka kasir terlebih dahulu untuk mulai melakukan transaksi penjualan dan melayani pelanggan.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Petugas Kasir:</span>
              <span className="font-bold text-slate-900">{profile?.full_name || 'Kasir'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Status Sesi:</span>
              <span className="font-black text-rose-600 inline-flex items-center gap-1">
                <Lock size={12} />
                Belum Ada Sesi Aktif
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            icon={DoorOpen}
            onClick={() => setIsOpenCashierOpen(true)}
            className="w-full py-3.5 text-sm font-black bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-500/25 cursor-pointer"
          >
            Buka Kasir Sekarang
          </Button>
        </div>

        {/* Modal Buka Kasir */}
        <OpenCashierModal
          isOpen={isOpenCashierOpen}
          onClose={() => setIsOpenCashierOpen(false)}
          onSuccess={(newSession) => {
            setToast({
              isOpen: true,
              message: `Kasir berhasil dibuka! Saldo awal tunai: ${formatRupiah(newSession.opening_cash)}`,
              type: 'success',
            });
            refetchSession();
          }}
        />

        {/* Toast */}
        <Toast
          isOpen={toast.isOpen}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, isOpen: false })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-screen bg-slate-100 overflow-hidden">
      {/* Header Terminal Kasir */}
      <POSHeader
        onOpenScanner={() => setIsScannerOpen(true)}
        activeSession={activeSession}
        onOpenCashier={() => setIsOpenCashierOpen(true)}
        onOpenCashMovement={(type) =>
          setCashMovementModalState({
            isOpen: true,
            type: type || 'cash_out',
          })
        }
      />

      {/* Main Layout 2 Kolom (Desktop) / 1 Kolom (Mobile) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Kolom Kiri: Katalog & Pencarian */}
        <div className="flex-1 flex flex-col min-w-0 p-3 sm:p-4 overflow-y-auto space-y-2.5 sm:space-y-3">
          <div className="space-y-2">
            <ProductSearch
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onClear={() => setSearchTerm('')}
              onSubmit={(val) => handleScanSuccess(val)}
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
              onOpenVariants={handleOpenVariants}
              onOpenSaleUnits={handleOpenSaleUnits}
              onRetry={() => refetch()}
              onOpenUnregModal={() => handleOpenAddUnreg({ name: searchTerm })}
            />
          </div>
        </div>

        {/* Kolom Kanan: Panel Keranjang Desktop */}
        <div className="hidden lg:flex w-80 xl:w-96 border-l border-slate-200/90 bg-white shrink-0 flex-col h-full shadow-lg z-10">
          <CartPanel onCheckout={handleOpenCheckout} />
        </div>
      </div>

      {/* Mobile Floating Cart Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20 shadow-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-slate-500 font-medium">Total Belanja:</p>
          <p className="text-lg font-black text-red-600 font-mono leading-none mt-0.5">
            {formatRupiah(totalAmount)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => toggleMobileCart(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md shadow-red-500/25 active:scale-95 transition-all cursor-pointer"
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

      {/* Modal Buka Kasir */}
      <OpenCashierModal
        isOpen={isOpenCashierOpen}
        onClose={() => setIsOpenCashierOpen(false)}
        onSuccess={(newSession) => {
          setToast({
            isOpen: true,
            message: `Kasir berhasil dibuka! Saldo awal tunai: ${formatRupiah(newSession.opening_cash)}`,
            type: 'success',
          });
          refetchSession();
        }}
      />

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

      {/* Modal Ajukan Barang Baru ke Pemilik */}
      <ProductSubmissionModal
        isOpen={isUnregModalOpen}
        onClose={() => setIsUnregModalOpen(false)}
        initialBarcode={unregInitialData?.barcode || notFoundBarcode || ''}
        initialName={unregInitialData?.name || ''}
        onSuccess={(savedItem) => {
          queryClient.invalidateQueries({ queryKey: ['pos-products'] });
          queryClient.invalidateQueries({ queryKey: ['product-submissions'] });

          addItem({
            id: savedItem.id,
            name: savedItem.name,
            price: Number(savedItem.selling_price) || 0,
            unit: 'Item',
            unit_name: 'Item',
            barcode: savedItem.barcode,
            allowDecimal: false,
            sourceType: 'temporary',
          });

          setToast({
            isOpen: true,
            message: `Pengajuan "${savedItem.name}" berhasil dikirim ke Pemilik & masuk keranjang!`,
            type: 'success',
          });
        }}
      />

      {/* Modal Pilih Varian Produk */}
      <VariantSelectorModal
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setVariantModalProduct(null);
        }}
        product={variantModalProduct}
        onSelectVariant={handleSelectVariant}
      />

      {/* Modal Pilih Satuan Penjualan Multi-Unit */}
      <SaleUnitSelectorModal
        isOpen={saleUnitModalState.isOpen}
        onClose={() =>
          setSaleUnitModalState({
            isOpen: false,
            product: null,
            variant: null,
            saleUnits: [],
          })
        }
        product={saleUnitModalState.product}
        variant={saleUnitModalState.variant}
        saleUnits={saleUnitModalState.saleUnits}
        onSelectUnit={handleSelectSaleUnit}
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

      {/* Modal Ambil Uang / Kas Masuk */}
      {cashMovementModalState.isOpen && activeSession && (
        <CashMovementModal
          isOpen={cashMovementModalState.isOpen}
          onClose={() => setCashMovementModalState({ ...cashMovementModalState, isOpen: false })}
          sessionId={activeSession.id}
          currentAvailableCash={activeSession.expected_cash || activeSession.opening_cash}
          defaultType={cashMovementModalState.type}
          onSuccess={() => {
            refetchSession();
            setToast({
              isOpen: true,
              message:
                cashMovementModalState.type === 'cash_out'
                  ? 'Pengambilan uang (kas keluar) berhasil dicatat!'
                  : 'Kas masuk berhasil dicatat!',
              type: 'success',
            });
          }}
        />
      )}

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
