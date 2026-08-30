import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper untuk menghitung total kuantitas dan total belanja
const recalculateTotals = (items) => {
  let totalQuantity = 0;
  let totalAmount = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const subtotal = Math.round(qty * price * 100) / 100;
    const conv = Number(item.conversionQty) || 1;

    item.subtotal = subtotal;
    item.stockDeduction = Math.round(qty * conv * 1000) / 1000;
    totalQuantity += qty;
    totalAmount += subtotal;
  });

  return {
    items,
    totalQuantity: Math.round(totalQuantity * 1000) / 1000,
    subtotal: totalAmount,
    totalAmount: totalAmount,
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      totalQuantity: 0,
      subtotal: 0,
      totalAmount: 0,
      isMobileCartOpen: false,
      lastWarning: null,

      setWarning: (message) => {
        set({ lastWarning: message });
        setTimeout(() => {
          if (get().lastWarning === message) {
            set({ lastWarning: null });
          }
        }, 3500);
      },

      clearWarning: () => set({ lastWarning: null }),

      toggleMobileCart: (isOpen) => {
        set((state) => ({
          isMobileCartOpen:
            typeof isOpen === 'boolean' ? isOpen : !state.isMobileCartOpen,
        }));
      },

      /**
       * Menambahkan item ke keranjang dengan dukungan Satuan Penjualan & Konversi Stok Dasar
       */
      addItem: (itemData, initialQty = 1) => {
        const { items } = get();
        const isProduct = itemData.sourceType === 'product' || !itemData.sourceType;
        const productId = isProduct ? (itemData.productId || itemData.id) : null;
        const variantId = isProduct ? (itemData.variantId || itemData.variant_id || null) : null;
        const saleUnitId = isProduct ? (itemData.saleUnitId || itemData.sale_unit_id || null) : null;

        // Key unik di keranjang membedakan varian dan satuan penjualan yang berbeda
        const itemId = isProduct
          ? `prod-${productId}-var-${variantId || 'base'}-unit-${saleUnitId || 'base'}`
          : `temp-${itemData.id}`;

        const existingIndex = items.findIndex((i) => i.id === itemId);
        const qtyToAdd = Number(initialQty) || 1;
        const conversionQty = Number(itemData.conversionQty || itemData.conversion_qty || 1);

        const pName = itemData.productName || itemData.name;
        const vName = itemData.variantName || itemData.variant_name || null;
        const suName = itemData.saleUnitName || itemData.sale_unit_name || null;

        let dName = itemData.displayName;
        if (!dName) {
          dName = pName;
          if (vName) dName += ` - ${vName}`;
          if (suName) dName += ` (${suName})`;
        }

        const baseStock = isProduct ? (itemData.stock !== null && itemData.stock !== undefined ? Number(itemData.stock) : null) : null;
        const baseUnitSymbol =
          itemData.unit?.symbol ||
          itemData.unit?.name ||
          itemData.unit_name ||
          itemData.unitSymbol ||
          'Pcs';

        // Hitung total stok dasar yang sudah terpakai di keranjang untuk produk & varian ini
        const otherCartItemsUsage = items
          .filter((i) => i.productId === productId && i.variantId === variantId && i.id !== itemId)
          .reduce((sum, i) => sum + (Number(i.quantity) * (Number(i.conversionQty) || 1)), 0);

        if (existingIndex > -1) {
          // Item sudah ada di keranjang, tambah quantity
          const existingItem = items[existingIndex];
          const newQty = existingItem.allowDecimal
            ? Math.round((existingItem.quantity + qtyToAdd) * 1000) / 1000
            : existingItem.quantity + Math.round(qtyToAdd);

          const totalBaseDeduction = (newQty * conversionQty) + otherCartItemsUsage;

          if (isProduct && baseStock !== null && totalBaseDeduction > baseStock) {
            get().setWarning(
              `Stok ${dName} tidak mencukupi. Kebutuhan: ${totalBaseDeduction} ${baseUnitSymbol}, Sisa stok: ${baseStock} ${baseUnitSymbol}`
            );
            return {
              success: false,
              message: `Stok tidak mencukupi. Tersedia: ${baseStock} ${baseUnitSymbol}`,
            };
          }

          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...existingItem,
            quantity: newQty,
          };

          const calculated = recalculateTotals(updatedItems);
          set({ ...calculated });
          return { success: true, item: updatedItems[existingIndex] };
        } else {
          // Item baru masuk keranjang
          const allowDecimalVal = Boolean(
            itemData.unit?.allow_decimal || itemData.allowDecimal
          );

          const requiredBaseStock = (qtyToAdd * conversionQty) + otherCartItemsUsage;

          if (isProduct && baseStock !== null && baseStock <= 0) {
            get().setWarning(`Stok ${dName} habis.`);
            return { success: false, message: 'Stok produk/varian habis.' };
          }

          if (isProduct && baseStock !== null && requiredBaseStock > baseStock) {
            get().setWarning(
              `Stok ${dName} tidak mencukupi. Kebutuhan: ${requiredBaseStock} ${baseUnitSymbol}, Sisa stok: ${baseStock} ${baseUnitSymbol}`
            );
            return {
              success: false,
              message: `Stok tidak mencukupi. Tersedia: ${baseStock} ${baseUnitSymbol}`,
            };
          }

          const newItem = {
            id: itemId,
            sourceType: isProduct ? 'product' : 'temporary',
            productId: productId,
            variantId: variantId,
            saleUnitId: saleUnitId,
            temporaryPriceId: !isProduct ? itemData.id : null,
            name: pName,
            productName: pName,
            variantName: vName,
            saleUnitName: suName,
            displayName: dName,
            code: itemData.code || null,
            barcode: itemData.barcode || null,
            price: Number(itemData.selling_price || itemData.price) || 0,
            conversionQty: conversionQty,
            unit: suName || baseUnitSymbol,
            baseUnitSymbol: baseUnitSymbol,
            allowDecimal: allowDecimalVal,
            quantity: allowDecimalVal
              ? Math.round(qtyToAdd * 1000) / 1000
              : Math.round(qtyToAdd),
            stock: baseStock,
            stockDeduction: Math.round(qtyToAdd * conversionQty * 1000) / 1000,
            subtotal: 0,
          };

          const updatedItems = [newItem, ...items];
          const calculated = recalculateTotals(updatedItems);
          set({ ...calculated });
          return { success: true, item: newItem };
        }
      },

      /**
       * Menambah kuantitas item (+1 atau step)
       */
      increaseQuantity: (id, step = 1) => {
        const { items } = get();
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return;

        const item = items[index];
        const stepVal = Number(step) || 1;
        const newQty = item.allowDecimal
          ? Math.round((item.quantity + stepVal) * 1000) / 1000
          : item.quantity + 1;

        const conv = Number(item.conversionQty) || 1;
        const otherUsage = items
          .filter((i) => i.productId === item.productId && i.variantId === item.variantId && i.id !== id)
          .reduce((sum, i) => sum + (Number(i.quantity) * (Number(i.conversionQty) || 1)), 0);

        const totalDeduction = (newQty * conv) + otherUsage;

        if (
          item.sourceType === 'product' &&
          item.stock !== null &&
          totalDeduction > item.stock
        ) {
          get().setWarning(
            `Stok ${item.displayName || item.name} tidak mencukupi (Tersedia: ${item.stock} ${item.baseUnitSymbol || 'Pcs'}, Butuh: ${totalDeduction})`
          );
          return;
        }

        const updatedItems = [...items];
        updatedItems[index] = { ...item, quantity: newQty };
        set({ ...recalculateTotals(updatedItems) });
      },

      /**
       * Mengurangi kuantitas item (-1 atau step)
       */
      decreaseQuantity: (id, step = 1) => {
        const { items } = get();
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return;

        const item = items[index];
        const stepVal = Number(step) || 1;
        const minAllowed = item.allowDecimal ? 0.001 : 1;
        let newQty = item.allowDecimal
          ? Math.round((item.quantity - stepVal) * 1000) / 1000
          : item.quantity - 1;

        if (newQty < minAllowed) {
          newQty = minAllowed;
        }

        const updatedItems = [...items];
        updatedItems[index] = { ...item, quantity: newQty };
        set({ ...recalculateTotals(updatedItems) });
      },

      /**
       * Mengatur kuantitas langsung dari input keyboard
       */
      setQuantity: (id, rawValue) => {
        const { items } = get();
        const index = items.findIndex((i) => i.id === id);
        if (index === -1) return;

        const item = items[index];
        let val = parseFloat(rawValue);

        if (isNaN(val) || val <= 0) {
          val = item.allowDecimal ? 0.001 : 1;
        }

        if (!item.allowDecimal) {
          val = Math.max(1, Math.round(val));
        } else {
          val = Math.round(val * 1000) / 1000;
        }

        const conv = Number(item.conversionQty) || 1;
        const otherUsage = items
          .filter((i) => i.productId === item.productId && i.variantId === item.variantId && i.id !== id)
          .reduce((sum, i) => sum + (Number(i.quantity) * (Number(i.conversionQty) || 1)), 0);

        let totalDeduction = (val * conv) + otherUsage;

        if (
          item.sourceType === 'product' &&
          item.stock !== null &&
          totalDeduction > item.stock
        ) {
          const maxAllowedQty = Math.floor((item.stock - otherUsage) / conv);
          val = Math.max(item.allowDecimal ? 0.001 : 1, maxAllowedQty);
          get().setWarning(
            `Stok ${item.displayName || item.name} tidak mencukupi (Tersedia: ${item.stock} ${item.baseUnitSymbol || 'Pcs'})`
          );
        }

        const updatedItems = [...items];
        updatedItems[index] = { ...item, quantity: val };
        set({ ...recalculateTotals(updatedItems) });
      },

      /**
       * Menghapus item dari keranjang
       */
      removeItem: (id) => {
        const { items } = get();
        const updatedItems = items.filter((i) => i.id !== id);
        set({ ...recalculateTotals(updatedItems) });
      },

      /**
       * Mengosongkan seluruh isi keranjang
       */
      clearCart: () => {
        set({
          items: [],
          totalQuantity: 0,
          subtotal: 0,
          totalAmount: 0,
          lastWarning: null,
        });
      },
    }),
    {
      name: 'kasir_cart_storage',
      partialize: (state) => ({
        items: state.items,
        totalQuantity: state.totalQuantity,
        subtotal: state.subtotal,
        totalAmount: state.totalAmount,
      }),
    }
  )
);

export default useCartStore;
