import { supabase } from '@/lib/supabase';

export const posService = {
  /**
   * Mengambil seluruh produk aktif untuk antarmuka kasir
   */
  async getPOSProducts({ search = '', categoryId = '' } = {}) {
    let query = supabase
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
        category:categories (
          id,
          name
        ),
        unit:units (
          id,
          name,
          symbol,
          allow_decimal
        )
      `)
      .eq('status', true)
      .order('name', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      query = query.or(
        `name.ilike.%${cleanSearch}%,code.ilike.%${cleanSearch}%,barcode.ilike.%${cleanSearch}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('[posService] Error getPOSProducts:', error);
      throw error;
    }

    return (data || []).map((p) => ({
      ...p,
      sourceType: 'product',
    }));
  },

  /**
   * Pencarian terpadu produk resmi + harga belum terdaftar untuk POS
   */
  async searchPOSUnified(term = '') {
    if (!term || !term.trim()) {
      return this.getPOSProducts();
    }

    const cleanTerm = term.trim();

    // 1. Query produk resmi
    const productsPromise = supabase
      .from('products')
      .select(`
        id,
        code,
        barcode,
        name,
        selling_price,
        stock,
        minimum_stock,
        category:categories (id, name),
        unit:units (id, name, symbol, allow_decimal)
      `)
      .eq('status', true)
      .or(`name.ilike.%${cleanTerm}%,code.ilike.%${cleanTerm}%,barcode.ilike.%${cleanTerm}%`)
      .order('name', { ascending: true });

    // 2. Query harga belum terdaftar
    const unregPromise = supabase
      .from('unregistered_prices')
      .select('*')
      .eq('status', 'pending')
      .or(`name.ilike.%${cleanTerm}%,barcode.ilike.%${cleanTerm}%`)
      .order('created_at', { ascending: false });

    const [prodRes, unregRes] = await Promise.all([productsPromise, unregPromise]);

    if (prodRes.error) throw prodRes.error;
    if (unregRes.error) throw unregRes.error;

    const formattedProducts = (prodRes.data || []).map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      barcode: p.barcode,
      price: Number(p.selling_price) || 0,
      stock: Number(p.stock) || 0,
      minimumStock: Number(p.minimum_stock) || 0,
      categoryName: p.category?.name || 'Umum',
      unitSymbol: p.unit?.symbol || 'Item',
      allowDecimal: Boolean(p.unit?.allow_decimal),
      sourceType: 'product',
      unit: p.unit,
    }));

    const formattedUnreg = (unregRes.data || []).map((u) => ({
      id: u.id,
      name: u.name,
      code: null,
      barcode: u.barcode,
      price: Number(u.selling_price) || 0,
      stock: null,
      minimumStock: 0,
      categoryName: 'Belum Terdaftar',
      unitSymbol: u.unit_name || 'Item',
      allowDecimal: false,
      sourceType: 'temporary',
      notes: u.notes,
      unit: { symbol: u.unit_name || 'Item', allow_decimal: false },
    }));

    return [...formattedProducts, ...formattedUnreg];
  },
};

export default posService;
