import { supabase } from '@/lib/supabase';
import { productService } from './productService';

export const unregisteredPriceService = {
  /**
   * Mengambil data barang belum terdaftar
   */
  async getUnregisteredPrices({ search = '', status = 'all' } = {}) {
    let query = supabase
      .from('unregistered_prices')
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role),
        converted_product:products!converted_product_id(id, name, code)
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all' && status) {
      query = query.eq('status', status);
    }

    if (search.trim()) {
      const term = search.trim();
      query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Menambah harga barang belum terdaftar (dapat dilakukan oleh Kasir & Pemilik)
   */
  async createUnregisteredPrice({
    name,
    selling_price,
    barcode = null,
    unit_name = null,
    notes = null,
  }) {
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Nama barang wajib diisi.');
    if (Number(selling_price) < 0) throw new Error('Harga jual tidak boleh negatif.');

    const trimmedBarcode = barcode?.trim() || null;

    // Cek jika barcode sudah ada di produk resmi
    if (trimmedBarcode) {
      const existingProduct = await productService.checkBarcodeExists(trimmedBarcode);
      if (existingProduct) {
        throw new Error(
          `Barcode "${trimmedBarcode}" sudah terdaftar sebagai produk resmi "${existingProduct.name}".`
        );
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
      name: trimmedName,
      selling_price: Number(selling_price) || 0,
      barcode: trimmedBarcode,
      unit_name: unit_name?.trim() || null,
      notes: notes?.trim() || null,
      status: 'pending',
      created_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from('unregistered_prices')
      .insert([insertData])
      .select(`
        *,
        creator:profiles!created_by(id, full_name, role)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengubah status / data harga belum terdaftar
   */
  async updateUnregisteredPrice(id, updateFields) {
    const { data, error } = await supabase
      .from('unregistered_prices')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Konversi Barang Belum Terdaftar menjadi Data Barang Resmi
   */
  async convertToProduct(unregisteredId, productFormValues) {
    // 1. Buat produk resmi di tabel products
    const newProduct = await productService.createProduct(productFormValues);

    // 2. Update status unregistered_prices menjadi 'converted'
    const { error: updateError } = await supabase
      .from('unregistered_prices')
      .update({
        status: 'converted',
        converted_product_id: newProduct.id,
      })
      .eq('id', unregisteredId);

    if (updateError) {
      console.warn('[UnregisteredPriceService] Gagal update status konversi:', updateError);
    }

    return newProduct;
  },

  /**
   * Nonaktifkan item belum terdaftar
   */
  async deactivate(id) {
    return this.updateUnregisteredPrice(id, { status: 'inactive' });
  },
};

export default unregisteredPriceService;
