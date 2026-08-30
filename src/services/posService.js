import { supabase } from '@/lib/supabase';

export const posService = {
  /**
   * Mengambil seluruh produk aktif untuk antarmuka kasir (termasuk varian)
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
        has_variants,
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

    let results = data || [];

    // Ambil data varian secara terpisah agar aman dari schema cache embed join
    if (results.length > 0) {
      const productIds = results.map((p) => p.id);
      try {
        const { data: variantsData, error: varError } = await supabase
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
            unit_id,
            unit:units (
              id,
              name,
              symbol,
              allow_decimal
            )
          `)
          .in('product_id', productIds)
          .eq('status', true);

        if (!varError && variantsData) {
          const variantMap = {};
          variantsData.forEach((v) => {
            if (!variantMap[v.product_id]) variantMap[v.product_id] = [];
            variantMap[v.product_id].push(v);
          });

          results = results.map((p) => ({
            ...p,
            product_variants: variantMap[p.id] || [],
          }));
        }
      } catch (e) {
        console.warn('[posService] Variant query skipped:', e);
      }
    }

    // Jika pencarian ada, cek juga apakah ada varian yang cocok
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      try {
        const { data: matchedVariants } = await supabase
          .from('product_variants')
          .select('product_id')
          .eq('status', true)
          .or(`variant_name.ilike.%${cleanSearch}%,code.ilike.%${cleanSearch}%,barcode.ilike.%${cleanSearch}%`);

        if (matchedVariants && matchedVariants.length > 0) {
          const variantProductIds = matchedVariants.map((v) => v.product_id);
          const missingIds = variantProductIds.filter((pid) => !results.some((r) => r.id === pid));

          if (missingIds.length > 0) {
            let extraQuery = supabase
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
                category:categories (id, name),
                unit:units (id, name, symbol, allow_decimal)
              `)
              .in('id', missingIds)
              .eq('status', true);

            if (categoryId) {
              extraQuery = extraQuery.eq('category_id', categoryId);
            }

            const { data: extraProducts } = await extraQuery;
            if (extraProducts) {
              // Ambil varian untuk extra products
              const { data: extraVarData } = await supabase
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
                  unit_id,
                  unit:units (id, name, symbol, allow_decimal)
                `)
                .in('product_id', missingIds)
                .eq('status', true);

              const extraMap = {};
              (extraVarData || []).forEach((v) => {
                if (!extraMap[v.product_id]) extraMap[v.product_id] = [];
                extraMap[v.product_id].push(v);
              });

              const formattedExtras = extraProducts.map((p) => ({
                ...p,
                product_variants: extraMap[p.id] || [],
              }));

              results = [...results, ...formattedExtras];
            }
          }
        }
      } catch (e) {}
    }

    return results.map((p) => ({
      ...p,
      sourceType: 'product',
    }));
  },

  /**
   * Pencarian terpadu produk resmi (dan varian) + harga belum terdaftar untuk POS
   */
  async searchPOSUnified(term = '') {
    if (!term || !term.trim()) {
      return this.getPOSProducts();
    }

    const cleanTerm = term.trim();

    // 1. Query produk resmi
    const productsPromise = this.getPOSProducts({ search: cleanTerm });

    // 2. Query harga belum terdaftar
    const unregPromise = supabase
      .from('unregistered_prices')
      .select('*')
      .eq('status', 'pending')
      .or(`name.ilike.%${cleanTerm}%,barcode.ilike.%${cleanTerm}%`)
      .order('created_at', { ascending: false });

    const [formattedProducts, unregRes] = await Promise.all([productsPromise, unregPromise]);

    if (unregRes.error) throw unregRes.error;

    const formattedUnreg = (unregRes.data || []).map((u) => ({
      id: u.id,
      name: u.name,
      code: null,
      barcode: u.barcode,
      price: Number(u.selling_price) || 0,
      selling_price: Number(u.selling_price) || 0,
      stock: null,
      minimumStock: 0,
      minimum_stock: 0,
      categoryName: 'Belum Terdaftar',
      category: { name: 'Belum Terdaftar' },
      unitSymbol: u.unit_name || 'Item',
      allowDecimal: false,
      sourceType: 'temporary',
      notes: u.notes,
      unit: { symbol: u.unit_name || 'Item', allow_decimal: false },
      has_variants: false,
    }));

    return [...formattedProducts, ...formattedUnreg];
  },
};

export default posService;
