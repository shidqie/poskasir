import { supabase } from '@/lib/supabase';

export const priceService = {
  /**
   * Pencarian Harga Terpadu (Products + Unregistered Prices)
   * Prioritas:
   * 1. Produk Resmi Terdaftar (status = true)
   * 2. Barang Belum Terdaftar (status = 'pending')
   */
  async searchAllPrices(search = '') {
    const term = search.trim();

    // 1. Query produk resmi aktif
    let productsQuery = supabase
      .from('products')
      .select(`
        id,
        code,
        barcode,
        name,
        selling_price,
        stock,
        minimum_stock,
        status,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal)
      `)
      .eq('status', true)
      .order('name', { ascending: true });

    if (term) {
      productsQuery = productsQuery.or(
        `name.ilike.%${term}%,code.ilike.%${term}%,barcode.ilike.%${term}%`
      );
    }

    // 2. Query barang belum terdaftar aktif (pending)
    let unregisteredQuery = supabase
      .from('unregistered_prices')
      .select(`
        id,
        barcode,
        name,
        selling_price,
        unit_name,
        notes,
        status,
        created_at
      `)
      .eq('status', 'pending')
      .order('name', { ascending: true });

    if (term) {
      unregisteredQuery = unregisteredQuery.or(
        `name.ilike.%${term}%,barcode.ilike.%${term}%`
      );
    }

    const [productsRes, unregisteredRes] = await Promise.all([
      productsQuery,
      unregisteredQuery,
    ]);

    if (productsRes.error) throw productsRes.error;
    if (unregisteredRes.error) throw unregisteredRes.error;

    // Normalisasi format item
    const formattedProducts = (productsRes.data || []).map((item) => ({
      id: item.id,
      sourceType: 'registered',
      name: item.name,
      code: item.code,
      barcode: item.barcode,
      price: item.selling_price,
      unitSymbol: item.unit?.symbol || item.unit?.name || 'Pcs',
      categoryName: item.category?.name || 'Umum',
      stock: item.stock,
      minimumStock: item.minimum_stock,
      notes: null,
      raw: item,
    }));

    const formattedUnregistered = (unregisteredRes.data || []).map((item) => ({
      id: item.id,
      sourceType: 'unregistered',
      name: item.name,
      code: null,
      barcode: item.barcode,
      price: item.selling_price,
      unitSymbol: item.unit_name || 'Item',
      categoryName: 'Belum Ada Kategori',
      stock: null, // Jangan campur data stok untuk barang sementara
      minimumStock: null,
      notes: item.notes,
      raw: item,
    }));

    // Gabungkan dengan urutan: registered first, then unregistered
    return [...formattedProducts, ...formattedUnregistered];
  },

  /**
   * Mengambil riwayat perubahan harga untuk suatu produk
   */
  async getPriceHistory(productId) {
    if (!productId) return [];

    const { data, error } = await supabase
      .from('product_price_history')
      .select(`
        id,
        old_price,
        new_price,
        changed_at,
        changer:profiles!changed_by(id, full_name, role)
      `)
      .eq('product_id', productId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

export default priceService;
