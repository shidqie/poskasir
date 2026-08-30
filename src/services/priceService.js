import { supabase } from '@/lib/supabase';

export const priceService = {
  /**
   * Pencarian Harga Terpadu (Products + Product Variants + Unregistered Prices)
   * Prioritas:
   * 1. Produk Resmi Terdaftar & Varian (status = true)
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
        has_variants,
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

    let allProducts = productsRes.data || [];

    // Ambil data varian secara terpisah
    if (allProducts.length > 0) {
      const productIds = allProducts.map((p) => p.id);
      try {
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select(`
            id,
            product_id,
            variant_name,
            code,
            barcode,
            selling_price,
            stock,
            minimum_stock,
            status,
            unit:units(id, name, symbol, allow_decimal)
          `)
          .in('product_id', productIds)
          .eq('status', true);

        if (variantsData) {
          const varMap = {};
          variantsData.forEach((v) => {
            if (!varMap[v.product_id]) varMap[v.product_id] = [];
            varMap[v.product_id].push(v);
          });

          allProducts = allProducts.map((p) => ({
            ...p,
            product_variants: varMap[p.id] || [],
          }));
        }
      } catch (e) {}
    }

    // Format item hasil: Pecah produk bervarian menjadi item varian individual
    const formattedProducts = [];

    allProducts.forEach((item) => {
      if (item.has_variants && item.product_variants?.length > 0) {
        const variants = item.product_variants.filter((v) => v.status);
        variants.forEach((v) => {
          if (
            !term ||
            item.name.toLowerCase().includes(term.toLowerCase()) ||
            v.variant_name.toLowerCase().includes(term.toLowerCase()) ||
            (v.barcode && v.barcode.toLowerCase().includes(term.toLowerCase())) ||
            (v.code && v.code.toLowerCase().includes(term.toLowerCase()))
          ) {
            formattedProducts.push({
              id: item.id,
              variantId: v.id,
              sourceType: 'registered',
              name: `${item.name} - ${v.variant_name}`,
              productName: item.name,
              variantName: v.variant_name,
              code: v.code,
              barcode: v.barcode || item.barcode,
              price: v.selling_price,
              unitSymbol: v.unit?.symbol || item.unit?.symbol || 'Pcs',
              categoryName: item.category?.name || 'Umum',
              stock: v.stock,
              minimumStock: v.minimum_stock,
              notes: null,
              hasVariants: true,
              raw: { ...item, activeVariant: v },
            });
          }
        });
      } else {
        formattedProducts.push({
          id: item.id,
          variantId: null,
          sourceType: 'registered',
          name: item.name,
          productName: item.name,
          variantName: null,
          code: item.code,
          barcode: item.barcode,
          price: item.selling_price,
          unitSymbol: item.unit?.symbol || item.unit?.name || 'Pcs',
          categoryName: item.category?.name || 'Umum',
          stock: item.stock,
          minimumStock: item.minimum_stock,
          notes: null,
          hasVariants: false,
          raw: item,
        });
      }
    });

    const formattedUnregistered = (unregisteredRes.data || []).map((item) => ({
      id: item.id,
      variantId: null,
      sourceType: 'unregistered',
      name: item.name,
      productName: item.name,
      variantName: null,
      code: null,
      barcode: item.barcode,
      price: item.selling_price,
      unitSymbol: item.unit_name || 'Item',
      categoryName: 'Belum Ada Kategori',
      stock: null,
      minimumStock: null,
      notes: item.notes,
      hasVariants: false,
      raw: item,
    }));

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
