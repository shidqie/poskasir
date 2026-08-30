import { supabase } from '@/lib/supabase';

export const priceService = {
  /**
   * Pencarian Harga Terpadu (Products + Product Variants + Pending Product Submissions)
   * Prioritas:
   * 1. Produk Resmi Terdaftar & Varian (status = true / is_active = true)
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
        is_active,
        has_variants,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal)
      `)
      .order('name', { ascending: true });

    if (term) {
      productsQuery = productsQuery.or(
        `name.ilike.%${term}%,code.ilike.%${term}%,barcode.ilike.%${term}%`
      );
    }

    // 2. Query pengajuan barang berstatus 'pending' (Belum Terdaftar / Menunggu Persetujuan)
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

    // 3. Fallback query unregistered_prices jika ada
    let unregisteredQuery = supabase
      .from('unregistered_prices')
      .select('id, barcode, name, selling_price, unit_name, notes, status, created_at')
      .eq('status', 'pending');

    const [productsRes, submissionsRes] = await Promise.all([
      productsQuery,
      submissionsQuery,
    ]);

    if (productsRes.error) console.warn('[priceService] products error:', productsRes.error);
    if (submissionsRes.error) console.warn('[priceService] submissions error:', submissionsRes.error);

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
            name,
            barcode,
            price,
            stock,
            is_active
          `)
          .in('product_id', productIds);

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
      } catch (err) {
        console.warn('[priceService] fetch variants error:', err);
      }
    }

    // Format Produk Resmi
    const formattedProducts = [];
    allProducts.forEach((item) => {
      if (item.has_variants && item.product_variants?.length > 0) {
        item.product_variants.forEach((v) => {
          formattedProducts.push({
            id: `${item.id}-${v.id}`,
            productId: item.id,
            variantId: v.id,
            sourceType: 'registered',
            status: 'approved',
            name: `${item.name} (${v.name})`,
            productName: item.name,
            variantName: v.name,
            code: item.code,
            barcode: v.barcode || item.barcode,
            price: v.price || item.selling_price,
            selling_price: v.price || item.selling_price,
            unitSymbol: item.unit?.symbol || 'Pcs',
            categoryName: item.category?.name || 'Sembako',
            stock: v.stock,
            minimumStock: item.minimum_stock,
            hasVariants: true,
            raw: { ...item, activeVariant: v },
          });
        });
      } else {
        formattedProducts.push({
          id: item.id,
          productId: item.id,
          variantId: null,
          sourceType: 'registered',
          status: 'approved',
          name: item.name,
          productName: item.name,
          variantName: null,
          code: item.code,
          barcode: item.barcode,
          price: item.selling_price,
          selling_price: item.selling_price,
          unitSymbol: item.unit?.symbol || 'Pcs',
          categoryName: item.category?.name || 'Sembako',
          stock: item.stock,
          minimumStock: item.minimum_stock,
          hasVariants: false,
          raw: item,
        });
      }
    });

    // Format Pengajuan Pending
    const formattedSubmissions = (submissionsRes.data || []).map((sub) => ({
      id: sub.id,
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
      price: sub.selling_price,
      selling_price: sub.selling_price,
      unitSymbol: sub.unit?.symbol || 'Pcs',
      categoryName: sub.category?.name || 'Belum Ada Kategori',
      stock: null,
      minimumStock: null,
      notes: sub.notes,
      hasVariants: false,
      raw: sub,
    }));

    return [...formattedProducts, ...formattedSubmissions];
  },

  /**
   * Alias getAllPrices
   */
  async getAllPrices({ search = '', categoryId = '' } = {}) {
    let items = await this.searchAllPrices(search);
    if (categoryId) {
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
