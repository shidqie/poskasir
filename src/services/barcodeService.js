import { supabase } from '@/lib/supabase';

export const barcodeService = {
  /**
   * Mencari produk berdasarkan barcode
   * Urutan:
   * 1. Tabel products (status = true)
   * 2. Tabel unregistered_prices (status = 'pending')
   * 3. Jika tidak ditemukan -> type: 'not_found'
   */
  async lookupBarcode(rawBarcode) {
    if (!rawBarcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    const barcode = rawBarcode.trim();

    // 1. Cek di tabel products resmi
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
        category:categories (id, name),
        unit:units (id, name, symbol, allow_decimal)
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
          sourceType: 'product',
        },
      };
    }

    // 2. Cek di tabel unregistered_prices
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

    // 3. Tidak ditemukan sama sekali
    return {
      found: false,
      type: 'not_found',
      barcode,
    };
  },
};

export default barcodeService;
