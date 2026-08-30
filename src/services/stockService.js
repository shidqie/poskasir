import { supabase } from '@/lib/supabase';

export const stockService = {
  /**
   * Ambil riwayat mutasi stok produk
   */
  async getStockMovements(productId, { limit = 50 } = {}) {
    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id, movement_type, quantity, stock_before, stock_after,
        notes, created_at,
        created_by_profile:profiles!created_by(full_name),
        transaction:transactions!transaction_id(transaction_number)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Penyesuaian stok: masuk, keluar, atau koreksi
   */
  async adjustStock({ productId, movementType, quantity, notes, userId }) {
    // 1. Ambil stok saat ini
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', productId)
      .single();

    if (fetchError) throw fetchError;

    const stockBefore = Number(product.stock);
    let stockAfter;

    if (movementType === 'stock_in') {
      stockAfter = stockBefore + Number(quantity);
    } else if (movementType === 'adjustment') {
      stockAfter = Number(quantity); // Set langsung ke nilai baru
    } else {
      // stock_out
      stockAfter = Math.max(0, stockBefore - Number(quantity));
    }

    // 2. Update stok produk
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: stockAfter, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (updateError) throw updateError;

    // 3. Catat stock movement
    const { data, error: insertError } = await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        movement_type: movementType,
        quantity: movementType === 'adjustment' ? quantity - stockBefore : quantity,
        stock_before: stockBefore,
        stock_after: stockAfter,
        notes: notes || `Penyesuaian stok manual (${movementType})`,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return { stockAfter, movement: data };
  },
};

export default stockService;
