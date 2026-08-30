import { supabase } from '@/lib/supabase';

export const barcodeService = {
  /**
   * Mencari produk berdasarkan barcode / kode barang
   * Urutan Prioritas:
   * 1. Tabel product_variants (barcode atau code) -> varian spesifik langsung ke cart!
   * 2. Tabel products (barcode atau code) -> produk utama
   * 3. Tabel product_submissions (status = 'approved' atau 'pending')
   * 4. Tabel unregistered_prices (status = 'pending')
   * 5. Jika tidak ditemukan -> type: 'not_found'
   */
  async lookupBarcode(rawBarcode) {
    if (!rawBarcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    const barcode = String(rawBarcode).trim();
    if (!barcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    // 1. Prioritas Utama: Cek di tabel product_variants (by barcode atau code)
    try {
      const { data: variants, error: varError } = await supabase
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
            barcode,
            category_id,
            status,
            unit:units(id, name, symbol, allow_decimal)
          )
        `)
        .or(`barcode.eq.${barcode},code.ilike.${barcode}`)
        .eq('product.status', true)
        .limit(1);

      if (!varError && variants && variants.length > 0) {
        const variant = variants[0];
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

    // 2. Cek di tabel products resmi (by barcode atau code)
    try {
      const { data: products, error: prodError } = await supabase
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
        .or(`barcode.eq.${barcode},code.ilike.${barcode}`)
        .eq('status', true)
        .limit(1);

      if (prodError) {
        console.error('[barcodeService] Error lookup product:', prodError);
      }

      if (products && products.length > 0) {
        const product = products[0];
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
    } catch (e) {
      console.error('[barcodeService] Product lookup error:', e);
    }

    // 3. Cek di tabel product_submissions (pengajuan barang baru)
    try {
      const { data: submissions, error: subError } = await supabase
        .from('product_submissions')
        .select(`
          id,
          name,
          variant_name,
          barcode,
          selling_price,
          notes,
          status,
          unit:units(id, name, symbol, allow_decimal)
        `)
        .eq('barcode', barcode)
        .limit(1);

      if (!subError && submissions && submissions.length > 0) {
        const sub = submissions[0];
        return {
          found: true,
          type: 'temporary',
          data: {
            id: sub.id,
            temporaryPriceId: sub.id,
            name: sub.name,
            variantName: sub.variant_name,
            displayName: sub.variant_name ? `${sub.name} (${sub.variant_name})` : sub.name,
            barcode: sub.barcode,
            selling_price: Number(sub.selling_price) || 0,
            price: Number(sub.selling_price) || 0,
            unitSymbol: sub.unit?.symbol || 'Pcs',
            unit: sub.unit || { symbol: 'Pcs', allow_decimal: false },
            sourceType: 'temporary',
            notes: sub.notes,
            submissionStatus: sub.status,
          },
        };
      }
    } catch (e) {
      console.warn('[barcodeService] Submissions lookup error:', e);
    }

    // 4. Cek di tabel unregistered_prices
    try {
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
    } catch (e) {
      console.error('[barcodeService] Unreg lookup error:', e);
    }

    // 5. Tidak ditemukan sama sekali
    return {
      found: false,
      type: 'not_found',
      barcode,
    };
  },
};

export default barcodeService;
