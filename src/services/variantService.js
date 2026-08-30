import { supabase } from '@/lib/supabase';

export const variantService = {
  /**
   * Mengambil daftar varian untuk sebuah produk
   */
  async getVariantsByProductId(productId) {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        unit:units(id, name, symbol, allow_decimal)
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching variants:', error);
      throw new Error(error.message || 'Gagal memuat varian produk.');
    }
    return data || [];
  },

  /**
   * Mengambil detail satu varian
   */
  async getVariantById(id) {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(id, name, code, category_id, unit_id),
        unit:units(id, name, symbol, allow_decimal)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching variant by ID:', error);
      throw new Error(error.message || 'Gagal memuat detail varian.');
    }
    return data;
  },

  /**
   * Menghasilkan kode varian otomatis (VAR-0001)
   */
  async getNextVariantCode() {
    try {
      const { data, error } = await supabase.rpc('generate_variant_code');
      if (error) throw error;
      return data;
    } catch (err) {
      // Fallback generator jika RPC belum ter-apply
      const { data } = await supabase
        .from('product_variants')
        .select('code')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0 && data[0].code) {
        const lastNum = parseInt(data[0].code.replace('VAR-', ''), 10);
        if (!isNaN(lastNum)) {
          return `VAR-${String(lastNum + 1).padStart(4, '0')}`;
        }
      }
      return 'VAR-0001';
    }
  },

  /**
   * Tambah varian baru
   */
  async createVariant(variantData) {
    // Validasi barcode unik jika diisi
    if (variantData.barcode && variantData.barcode.trim()) {
      const { data: existingBarcode } = await supabase
        .from('product_variants')
        .select('id, variant_name')
        .eq('barcode', variantData.barcode.trim())
        .maybeSingle();

      if (existingBarcode) {
        throw new Error(`Barcode ${variantData.barcode} sudah digunakan oleh varian "${existingBarcode.variant_name}".`);
      }
    }

    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        product_id: variantData.product_id,
        variant_name: variantData.variant_name.trim(),
        code: variantData.code,
        barcode: variantData.barcode?.trim() || null,
        selling_price: Number(variantData.selling_price) || 0,
        stock: Number(variantData.stock) || 0,
        minimum_stock: Number(variantData.minimum_stock) || 0,
        unit_id: variantData.unit_id || null,
        status: variantData.status !== undefined ? variantData.status : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating variant:', error);
      throw new Error(error.message || 'Gagal menambahkan varian produk.');
    }
    return data;
  },

  /**
   * Update data varian
   */
  async updateVariant(id, variantData) {
    if (variantData.barcode && variantData.barcode.trim()) {
      const { data: existingBarcode } = await supabase
        .from('product_variants')
        .select('id, variant_name')
        .eq('barcode', variantData.barcode.trim())
        .neq('id', id)
        .maybeSingle();

      if (existingBarcode) {
        throw new Error(`Barcode ${variantData.barcode} sudah digunakan oleh varian "${existingBarcode.variant_name}".`);
      }
    }

    const updatePayload = {};
    if (variantData.variant_name !== undefined) updatePayload.variant_name = variantData.variant_name.trim();
    if (variantData.barcode !== undefined) updatePayload.barcode = variantData.barcode?.trim() || null;
    if (variantData.selling_price !== undefined) updatePayload.selling_price = Number(variantData.selling_price);
    if (variantData.minimum_stock !== undefined) updatePayload.minimum_stock = Number(variantData.minimum_stock);
    if (variantData.unit_id !== undefined) updatePayload.unit_id = variantData.unit_id || null;
    if (variantData.status !== undefined) updatePayload.status = variantData.status;

    // Jika stok diperbarui secara eksplisit (hanya jika diizinkan)
    if (variantData.stock !== undefined) {
      updatePayload.stock = Number(variantData.stock);
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating variant:', error);
      throw new Error(error.message || 'Gagal memperbarui data varian.');
    }
    return data;
  },

  /**
   * Hapus varian
   */
  async deleteVariant(id) {
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting variant:', error);
      throw new Error(error.message || 'Gagal menghapus varian.');
    }
    return true;
  },

  /**
   * Mengambil riwayat harga varian
   */
  async getVariantPriceHistory(variantId) {
    const { data, error } = await supabase
      .from('variant_price_history')
      .select(`
        *,
        changer:profiles!changed_by(id, full_name, role)
      `)
      .eq('variant_id', variantId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching variant price history:', error);
      throw new Error(error.message || 'Gagal memuat riwayat harga varian.');
    }
    return data || [];
  },

  /**
   * Cari varian berdasarkan barcode
   */
  async findVariantByBarcode(barcode) {
    if (!barcode) return null;
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products!inner(id, name, code, category_id, unit_id, status, has_variants),
        unit:units(id, name, symbol, allow_decimal)
      `)
      .eq('barcode', barcode.trim())
      .eq('status', true)
      .eq('product.status', true)
      .maybeSingle();

    if (error) {
      console.error('Error finding variant by barcode:', error);
      return null;
    }
    return data;
  }
};
