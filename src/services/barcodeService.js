import { supabase } from '@/lib/supabase';

export const barcodeService = {
  /**
   * Mencari produk berdasarkan barcode
   * Urutan Prioritas:
   * 1. Tabel product_variants (status = true) -> Varian spesifik langsung ke cart!
   * 2. Tabel products (status = true) -> Produk utama
   * 3. Tabel unregistered_prices (status = 'pending')
   * 4. Jika tidak ditemukan -> type: 'not_found'
   */
  async lookupBarcode(rawBarcode) {
    if (!rawBarcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    const barcode = rawBarcode.trim();

    // 1. Prioritas Utama: Cek di tabel product_variants
    try {
      const { data: variant, error: varError } = await supabase
        .from('product_variants')
        .select(`
          id,
          variant_name,
          code,
          barcode,
          selling_price,
          stock,
          minimum_stock,
          status,
          unit:units(id, name, symbol, allow_decimal),
          product:products!inner(
            id,
            name,
            code,
            category_id,
            status,
            unit:units(id, name, symbol, allow_decimal)
          )
        `)
        .eq('barcode', barcode)
        .eq('status', true)
        .eq('product.status', true)
        .maybeSingle();

      if (!varError && variant) {
        return {
          found: true,
          type: 'product',
          data: {
            sourceType: 'product',
            id: variant.product.id,
            productId: variant.product.id,
            variantId: variant.id,
            name: variant.product.name,
            productName: variant.product.name,
            variantName: variant.variant_name,
            displayName: `${variant.product.name} - ${variant.variant_name}`,
            selling_price: Number(variant.selling_price) || 0,
            stock: Number(variant.stock) || 0,
            minimum_stock: Number(variant.minimum_stock) || 0,
            code: variant.code,
            barcode: variant.barcode,
            unit: variant.unit || variant.product.unit,
            allowDecimal: Boolean(
              variant.unit?.allow_decimal || variant.product.unit?.allow_decimal
            ),
          },
        };
      }
    } catch (e) {
      console.warn('[barcodeService] Variant lookup error/skip:', e);
    }

    // 2. Cek di tabel products resmi
    const { data: product, error: prodError } = await supabase
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
        unit:units (id, name, symbol, allow_decimal),
        product_variants:product_variants (
          id,
          variant_name,
          code,
          barcode,
          selling_price,
          stock,
          minimum_stock,
          status,
          unit:units(id, name, symbol, allow_decimal)
        )
      `)
      .eq('barcode', barcode)
      .eq('status', true)
      .maybeSingle();

    if (prodError) {
      console.error('[barcodeService] Error lookup product:', prodError);
    }

    if (product) {
      return {
        found: true,
        type: 'product',
        data: {
          ...product,
          productId: product.id,
          sourceType: 'product',
        },
      };
    }

    // 3. Cek di tabel unregistered_prices
    const { data: unregItem, error: unregError } = await supabase
      .from('unregistered_prices')
      .select('*')
      .eq('barcode', barcode)
      .eq('status', 'pending')
      .maybeSingle();

    if (unregError) {
      console.error('[barcodeService] Error lookup unreg:', unregError);
    }

    if (unregItem) {
      return {
        found: true,
        type: 'temporary',
        data: {
          ...unregItem,
          sourceType: 'temporary',
        },
      };
    }

    // 4. Tidak ditemukan sama sekali
    return {
      found: false,
      type: 'not_found',
      barcode,
    };
  },
};

export default barcodeService;
