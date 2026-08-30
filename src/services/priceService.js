import { supabase } from '@/lib/supabase';

export const priceService = {
  /**
   * Pencarian Harga Terpadu (Products + Product Variants + Product Sale Units + Pending Product Submissions)
   * Prioritas:
   * 1. Produk Resmi Terdaftar & Varian & Satuan Penjualan (status = true)
   * 2. Pengajuan Barang Belum Terdaftar (status = 'pending')
   */
  async searchAllPrices(search = '') {
    const term = search?.trim();

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
        category_id,
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

    // 2. Query pengajuan barang berstatus 'pending'
    let submissionsQuery = supabase
      .from('product_submissions')
      .select(`
        id,
        barcode,
        name,
        variant_name,
        submission_type,
        selling_price,
        notes,
        status,
        created_at,
        unit:units(name, symbol),
        category:categories(name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (term) {
      submissionsQuery = submissionsQuery.or(
        `name.ilike.%${term}%,barcode.ilike.%${term}%,variant_name.ilike.%${term}%`
      );
    }

    const [productsRes, submissionsRes] = await Promise.all([
      productsQuery,
      submissionsQuery,
    ]);

    if (productsRes.error) console.warn('[priceService] products error:', productsRes.error);
    if (submissionsRes.error) console.warn('[priceService] submissions error:', submissionsRes.error);

    let allProducts = productsRes.data || [];

    // Ambil data varian dan satuan penjualan secara terpisah
    if (allProducts.length > 0) {
      const productIds = allProducts.map((p) => p.id);
      try {
        const [variantsRes, saleUnitsRes] = await Promise.all([
          supabase
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
            .eq('status', true),
          supabase
            .from('product_sale_units')
            .select('*')
            .in('product_id', productIds)
            .eq('status', true)
            .order('sort_order', { ascending: true })
            .order('conversion_qty', { ascending: true }),
        ]);

        const varMap = {};
        (variantsRes.data || []).forEach((v) => {
          if (!varMap[v.product_id]) varMap[v.product_id] = [];
          varMap[v.product_id].push(v);
        });

        const productUnitMap = {};
        const variantUnitMap = {};
        (saleUnitsRes.data || []).forEach((su) => {
          if (su.variant_id) {
            if (!variantUnitMap[su.variant_id]) variantUnitMap[su.variant_id] = [];
            variantUnitMap[su.variant_id].push(su);
          } else {
            if (!productUnitMap[su.product_id]) productUnitMap[su.product_id] = [];
            productUnitMap[su.product_id].push(su);
          }
        });

        allProducts = allProducts.map((p) => {
          const vars = (varMap[p.id] || []).map((v) => ({
            ...v,
            sale_units: variantUnitMap[v.id] || [],
          }));
          return {
            ...p,
            product_variants: vars,
            sale_units: productUnitMap[p.id] || [],
          };
        });
      } catch (err) {
        console.warn('[priceService] fetch variants / sale units error:', err);
      }
    }

    // Format Produk Resmi
    const formattedProducts = [];
    allProducts.forEach((item) => {
      if (item.has_variants && item.product_variants?.length > 0) {
        item.product_variants.forEach((v) => {
          formattedProducts.push({
            id: `prod-${item.id}-var-${v.id}`,
            productId: item.id,
            variantId: v.id,
            category_id: item.category_id,
            sourceType: 'registered',
            status: 'approved',
            name: `${item.name} (${v.variant_name})`,
            productName: item.name,
            variantName: v.variant_name,
            code: v.code || item.code,
            barcode: v.barcode || item.barcode,
            price: Number(v.selling_price || item.selling_price || 0),
            selling_price: Number(v.selling_price || item.selling_price || 0),
            unitSymbol: v.unit?.symbol || item.unit?.symbol || 'Pcs',
            categoryName: item.category?.name || 'Sembako',
            stock: v.stock,
            minimumStock: v.minimum_stock || item.minimum_stock,
            hasVariants: true,
            sale_units: v.sale_units || [],
            raw: { ...item, activeVariant: v },
          });
        });
      } else {
        formattedProducts.push({
          id: `prod-${item.id}`,
          productId: item.id,
          variantId: null,
          category_id: item.category_id,
          sourceType: 'registered',
          status: 'approved',
          name: item.name,
          productName: item.name,
          variantName: null,
          code: item.code,
          barcode: item.barcode,
          price: Number(item.selling_price || 0),
          selling_price: Number(item.selling_price || 0),
          unitSymbol: item.unit?.symbol || 'Pcs',
          categoryName: item.category?.name || 'Sembako',
          stock: item.stock,
          minimumStock: item.minimum_stock,
          hasVariants: false,
          sale_units: item.sale_units || [],
          raw: item,
        });
      }
    });

    // Format Pengajuan Pending
    const formattedSubmissions = (submissionsRes.data || []).map((sub) => ({
      id: `sub-${sub.id}`,
      submissionId: sub.id,
      productId: null,
      variantId: null,
      sourceType: 'unregistered',
      status: 'pending',
      submission_type: sub.submission_type,
      name: sub.submission_type === 'new_variant' ? `${sub.name} (${sub.variant_name})` : sub.name,
      productName: sub.name,
      variantName: sub.variant_name,
      code: null,
      barcode: sub.barcode,
      price: Number(sub.selling_price || 0),
      selling_price: Number(sub.selling_price || 0),
      unitSymbol: sub.unit?.symbol || 'Pcs',
      categoryName: sub.category?.name || 'Belum Ada Kategori',
      stock: null,
      minimumStock: null,
      notes: sub.notes,
      hasVariants: false,
      sale_units: [],
      raw: sub,
      rawSubmission: sub,
    }));

    return [...formattedProducts, ...formattedSubmissions];
  },

  /**
   * Alias getAllPrices
   */
  async getAllPrices({ search = '', categoryId = '' } = {}) {
    let items = await this.searchAllPrices(search);
    if (categoryId && categoryId !== 'all') {
      items = items.filter((item) => item.category_id === categoryId);
    }
    return items;
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
