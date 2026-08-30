import { supabase } from '@/lib/supabase';

export const saleUnitService = {
  /**
   * Mengambil semua satuan penjualan untuk produk tertentu (dan varian tertentu jika ada)
   */
  async getSaleUnitsByProduct(productId, variantId = null) {
    if (!productId) return [];

    let query = supabase
      .from('product_sale_units')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })
      .order('conversion_qty', { ascending: true });

    if (variantId) {
      query = query.eq('variant_id', variantId);
    } else {
      query = query.is('variant_id', null);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[saleUnitService] Error getSaleUnitsByProduct:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Mengambil semua satuan penjualan aktif untuk daftar ID produk (untuk POS & Daftar Harga)
   */
  async getSaleUnitsByProducts(productIds = []) {
    if (!productIds || productIds.length === 0) return [];

    const { data, error } = await supabase
      .from('product_sale_units')
      .select('*')
      .in('product_id', productIds)
      .eq('status', true)
      .order('sort_order', { ascending: true })
      .order('conversion_qty', { ascending: true });

    if (error) {
      console.error('[saleUnitService] Error getSaleUnitsByProducts:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Membuat satuan penjualan baru
   */
  async createSaleUnit(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Jika diatur default, nonaktifkan default lain pada produk/varian yang sama
    if (payload.is_default) {
      let resetQuery = supabase
        .from('product_sale_units')
        .update({ is_default: false })
        .eq('product_id', payload.product_id);

      if (payload.variant_id) {
        resetQuery = resetQuery.eq('variant_id', payload.variant_id);
      } else {
        resetQuery = resetQuery.is('variant_id', null);
      }
      await resetQuery;
    }

    const insertData = {
      product_id: payload.product_id,
      variant_id: payload.variant_id || null,
      name: payload.name.trim(),
      conversion_qty: Number(payload.conversion_qty),
      selling_price: Number(payload.selling_price),
      barcode: payload.barcode ? payload.barcode.trim() : null,
      is_default: Boolean(payload.is_default),
      status: payload.status !== undefined ? Boolean(payload.status) : true,
      sort_order: Number(payload.sort_order) || 0,
      created_by: user?.id || null,
      updated_by: user?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('product_sale_units')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[saleUnitService] Error createSaleUnit:', error);
      if (error.code === '23505') {
        if (error.message.includes('barcode')) {
          throw new Error('Barcode sudah digunakan oleh satuan penjualan lain.');
        }
        throw new Error('Nama satuan penjualan sudah terdaftar pada produk/varian ini.');
      }
      throw new Error(error.message || 'Gagal menambahkan satuan penjualan.');
    }

    return data;
  },

  /**
   * Memperbarui satuan penjualan
   */
  async updateSaleUnit(id, payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (payload.is_default && payload.product_id) {
      let resetQuery = supabase
        .from('product_sale_units')
        .update({ is_default: false })
        .eq('product_id', payload.product_id)
        .neq('id', id);

      if (payload.variant_id) {
        resetQuery = resetQuery.eq('variant_id', payload.variant_id);
      } else {
        resetQuery = resetQuery.is('variant_id', null);
      }
      await resetQuery;
    }

    const updateData = {
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    };

    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.conversion_qty !== undefined) updateData.conversion_qty = Number(payload.conversion_qty);
    if (payload.selling_price !== undefined) updateData.selling_price = Number(payload.selling_price);
    if (payload.barcode !== undefined) updateData.barcode = payload.barcode ? payload.barcode.trim() : null;
    if (payload.is_default !== undefined) updateData.is_default = Boolean(payload.is_default);
    if (payload.status !== undefined) updateData.status = Boolean(payload.status);
    if (payload.sort_order !== undefined) updateData.sort_order = Number(payload.sort_order);

    const { data, error } = await supabase
      .from('product_sale_units')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[saleUnitService] Error updateSaleUnit:', error);
      if (error.code === '23505') {
        if (error.message.includes('barcode')) {
          throw new Error('Barcode sudah digunakan oleh satuan penjualan lain.');
        }
        throw new Error('Nama satuan penjualan sudah terdaftar pada produk/varian ini.');
      }
      throw new Error(error.message || 'Gagal memperbarui satuan penjualan.');
    }

    return data;
  },

  /**
   * Menghapus satuan penjualan
   */
  async deleteSaleUnit(id) {
    const { error } = await supabase.from('product_sale_units').delete().eq('id', id);
    if (error) {
      console.error('[saleUnitService] Error deleteSaleUnit:', error);
      throw new Error(error.message || 'Gagal menghapus satuan penjualan.');
    }
    return true;
  },

  /**
   * Mengambil riwayat harga satuan penjualan
   */
  async getPriceHistory(saleUnitId) {
    if (!saleUnitId) return [];

    const { data, error } = await supabase
      .from('sale_unit_price_history')
      .select(`
        id,
        sale_unit_id,
        old_price,
        new_price,
        changed_at,
        changed_by,
        user:profiles!changed_by(id, full_name, email)
      `)
      .eq('sale_unit_id', saleUnitId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('[saleUnitService] Error getPriceHistory:', error);
      return [];
    }
    return data || [];
  },
};

export default saleUnitService;
