import { supabase } from '@/lib/supabase';

export const stockService = {
  /**
   * Ambil riwayat mutasi stok produk atau varian
   */
  async getStockMovements(productId, { variantId = null, limit = 50 } = {}) {
    let query = supabase
      .from('stock_movements')
      .select(`
        id, movement_type, quantity, stock_before, stock_after,
        notes, created_at, variant_id,
        created_by_profile:profiles!created_by(full_name),
        transaction:transactions!transaction_id(transaction_number),
        variant:product_variants!variant_id(variant_name, code)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Penyesuaian stok: masuk, keluar, atau koreksi (Mendukung Produk & Varian)
   */
  async adjustStock({ productId, variantId = null, movementType, quantity, notes, userId }) {
    let stockBefore = 0;
    let stockAfter = 0;
    let itemLabel = '';

    if (variantId) {
      // 1. Ambil stok varian
      const { data: variant, error: fetchError } = await supabase
        .from('product_variants')
        .select(`
          id, stock, variant_name,
          product:products(name)
        `)
        .eq('id', variantId)
        .single();

      if (fetchError) throw fetchError;

      stockBefore = Number(variant.stock) || 0;
      itemLabel = `${variant.product?.name || 'Produk'} (${variant.variant_name})`;

      if (movementType === 'stock_in') {
        stockAfter = stockBefore + Number(quantity);
      } else if (movementType === 'adjustment') {
        stockAfter = Number(quantity);
      } else {
        // stock_out
        stockAfter = Math.max(0, stockBefore - Number(quantity));
      }

      // Update stok varian
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock: stockAfter, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', variantId);

      if (updateError) throw updateError;
    } else {
      // 1. Ambil stok produk tunggal
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock, name')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      stockBefore = Number(product.stock) || 0;
      itemLabel = product.name;

      if (movementType === 'stock_in') {
        stockAfter = stockBefore + Number(quantity);
      } else if (movementType === 'adjustment') {
        stockAfter = Number(quantity);
      } else {
        // stock_out
        stockAfter = Math.max(0, stockBefore - Number(quantity));
      }

      // Update stok produk
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: stockAfter, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (updateError) throw updateError;
    }

    // 2. Catat stock movement
    const { data, error: insertError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        variant_id: variantId || null,
        movement_type: movementType,
        quantity: movementType === 'adjustment' ? Math.abs(quantity - stockBefore) : Number(quantity),
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes: notes || `Penyesuaian stok manual ${itemLabel} (${movementType})`,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return { stockAfter, itemLabel, movement: data };
  },
};

export default stockService;
