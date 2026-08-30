import { supabase } from '@/lib/supabase';

export const posService = {
  /**
   * Mengambil seluruh produk aktif untuk antarmuka kasir (termasuk varian dan satuan penjualan)
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

    // Jika pencarian ada, cek juga apakah ada varian atau satuan penjualan yang cocok
    if (search && search.trim()) {
      const cleanSearch = search.trim();
      try {
        // Cek kecocokan di varian
        const { data: matchedVariants } = await supabase
          .from('product_variants')
          .select('product_id')
          .eq('status', true)
          .or(`variant_name.ilike.%${cleanSearch}%,code.ilike.%${cleanSearch}%,barcode.ilike.%${cleanSearch}%`);

        // Cek kecocokan di satuan penjualan
        const { data: matchedSaleUnits } = await supabase
          .from('product_sale_units')
          .select('product_id')
          .eq('status', true)
          .or(`name.ilike.%${cleanSearch}%,barcode.ilike.%${cleanSearch}%`);

        const matchedIds = [
          ...(matchedVariants || []).map((v) => v.product_id),
          ...(matchedSaleUnits || []).map((s) => s.product_id),
        ];

        const missingIds = matchedIds.filter((pid) => !results.some((r) => r.id === pid));

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
          if (extraProducts && extraProducts.length > 0) {
            const extraProductIds = extraProducts.map((p) => p.id);
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
              .in('product_id', extraProductIds)
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
      } catch (e) {
        console.warn('[posService] Search matching query error/skip:', e);
      }
    }

    // Ambil semua Satuan Penjualan (product_sale_units) untuk seluruh produk hasil query
    if (results.length > 0) {
      const allProductIds = results.map((p) => p.id);
      try {
        const { data: saleUnitsData, error: suError } = await supabase
          .from('product_sale_units')
          .select('*')
          .in('product_id', allProductIds)
          .eq('status', true)
          .order('sort_order', { ascending: true })
          .order('conversion_qty', { ascending: true });

        if (!suError && saleUnitsData) {
          const productUnitMap = {};
          const variantUnitMap = {};

          saleUnitsData.forEach((su) => {
            if (su.variant_id) {
              if (!variantUnitMap[su.variant_id]) variantUnitMap[su.variant_id] = [];
              variantUnitMap[su.variant_id].push(su);
            } else {
              if (!productUnitMap[su.product_id]) productUnitMap[su.product_id] = [];
              productUnitMap[su.product_id].push(su);
            }
          });

          results = results.map((p) => {
            const pSaleUnits = productUnitMap[p.id] || [];
            const pVariants = (p.product_variants || []).map((v) => ({
              ...v,
              sale_units: variantUnitMap[v.id] || [],
            }));

            return {
              ...p,
              sale_units: pSaleUnits,
              product_variants: pVariants,
            };
          });
        }
      } catch (suErr) {
        console.warn('[posService] Sale units fetch skipped:', suErr);
      }
    }

    return results.map((p) => ({
      ...p,
      sourceType: 'product',
    }));
  },

  /**
   * Pencarian terpadu produk resmi (dan varian & satuan) + harga belum terdaftar untuk POS
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
      sale_units: [],
    }));

    return [...formattedProducts, ...formattedUnreg];
  },
};

export default posService;
