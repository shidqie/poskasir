import { supabase } from '@/lib/supabase';

export const barcodeService = {
  /**
   * Mencari produk berdasarkan barcode / kode barang
   * Urutan Prioritas:
   * 1. Tabel product_sale_units (barcode satuan penjualan, misal barcode Dus / Renceng / 1/2 Dus) -> langsung kenali satuan!
   * 2. Tabel product_variants (barcode varian atau kode varian) -> varian spesifik langsung ke cart!
   * 3. Tabel products (barcode atau kode produk utama) -> produk utama
   * 4. Tabel product_submissions (pengajuan barang baru)
   * 5. Tabel unregistered_prices (harga belum terdaftar)
   * 6. Jika tidak ditemukan -> type: 'not_found'
   */
  async lookupBarcode(rawBarcode) {
    if (!rawBarcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    const barcode = String(rawBarcode).trim();
    if (!barcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    // 1. PRIORITAS UTAMA: Cek di tabel product_sale_units (Spesifik Satuan Penjualan)
    try {
      const { data: saleUnits, error: saleUnitErr } = await supabase
        .from('product_sale_units')
        .select(`
          id,
          name,
          conversion_qty,
          selling_price,
          barcode,
          is_default,
          status,
          product_id,
          variant_id,
          product:products!inner(
            id,
            name,
            code,
            barcode,
            stock,
            minimum_stock,
            status,
            unit:units(id, name, symbol, allow_decimal)
          ),
          variant:product_variants(
            id,
            variant_name,
            code,
            barcode,
            stock,
            minimum_stock,
            status,
            unit:units(id, name, symbol, allow_decimal)
          )
        `)
        .eq('barcode', barcode)
        .eq('status', true)
        .eq('product.status', true)
        .limit(1);

      if (!saleUnitErr && saleUnits && saleUnits.length > 0) {
        const su = saleUnits[0];
        const p = su.product;
        const v = su.variant;
        const isVariant = Boolean(v && v.status !== false);

        const baseStock = isVariant ? Number(v.stock || 0) : Number(p.stock || 0);
        const baseUnit = (isVariant && v.unit) ? v.unit : (p.unit || { symbol: 'Pcs', allow_decimal: false });
        const pName = p.name;
        const vName = isVariant ? v.variant_name : null;
        const suName = su.name;

        let displayName = pName;
        if (vName) displayName += ` - ${vName}`;
        if (suName) displayName += ` (${suName})`;

        return {
          found: true,
          type: 'product',
          data: {
            sourceType: 'product',
            id: p.id,
            productId: p.id,
            variantId: isVariant ? v.id : null,
            saleUnitId: su.id,
            saleUnitName: suName,
            conversionQty: Number(su.conversion_qty) || 1,
            name: pName,
            productName: pName,
            variantName: vName,
            displayName,
            selling_price: Number(su.selling_price) || 0,
            price: Number(su.selling_price) || 0,
            stock: baseStock,
            minimum_stock: isVariant ? Number(v.minimum_stock || 0) : Number(p.minimum_stock || 0),
            code: isVariant ? (v.code || p.code) : p.code,
            barcode: su.barcode || (isVariant ? v.barcode : p.barcode),
            unit: baseUnit,
            allowDecimal: Boolean(baseUnit.allow_decimal),
          },
        };
      }
    } catch (e) {
      console.warn('[barcodeService] Sale unit lookup error/skip:', e);
    }

    // 2. Cek di tabel product_variants (by barcode atau code)
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

        // Ambil sale units untuk varian ini jika ada
        let matchedSaleUnit = null;
        try {
          const { data: suList } = await supabase
            .from('product_sale_units')
            .select('*')
            .eq('product_id', variant.product.id)
            .eq('variant_id', variant.id)
            .eq('status', true)
            .order('is_default', { ascending: false });

          if (suList && suList.length === 1) {
            matchedSaleUnit = suList[0];
          } else if (suList && suList.length > 1) {
            matchedSaleUnit = suList.find((s) => s.is_default) || suList[0];
          }
        } catch (suErr) {}

        const finalPrice = matchedSaleUnit ? Number(matchedSaleUnit.selling_price) : Number(variant.selling_price || 0);
        const suName = matchedSaleUnit ? matchedSaleUnit.name : null;
        let displayName = `${variant.product.name} - ${variant.variant_name}`;
        if (suName) displayName += ` (${suName})`;

        return {
          found: true,
          type: 'product',
          data: {
            sourceType: 'product',
            id: variant.product.id,
            productId: variant.product.id,
            variantId: variant.id,
            saleUnitId: matchedSaleUnit ? matchedSaleUnit.id : null,
            saleUnitName: suName,
            conversionQty: matchedSaleUnit ? Number(matchedSaleUnit.conversion_qty) : 1,
            name: variant.product.name,
            productName: variant.product.name,
            variantName: variant.variant_name,
            displayName,
            selling_price: finalPrice,
            price: finalPrice,
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

    // 3. Cek di tabel products resmi (by barcode atau code)
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

        // Ambil sale units untuk produk non-varian ini
        let matchedSaleUnit = null;
        let allSaleUnits = [];
        try {
          const { data: suList } = await supabase
            .from('product_sale_units')
            .select('*')
            .eq('product_id', product.id)
            .is('variant_id', null)
            .eq('status', true)
            .order('is_default', { ascending: false });

          if (suList && suList.length > 0) {
            allSaleUnits = suList;
            if (suList.length === 1) {
              matchedSaleUnit = suList[0];
            } else {
              matchedSaleUnit = suList.find((s) => s.is_default);
            }
          }
        } catch (suErr) {}

        const finalPrice = matchedSaleUnit ? Number(matchedSaleUnit.selling_price) : Number(product.selling_price || 0);
        const suName = matchedSaleUnit ? matchedSaleUnit.name : null;
        let displayName = product.name;
        if (suName) displayName += ` (${suName})`;

        return {
          found: true,
          type: 'product',
          data: {
            ...product,
            productId: product.id,
            sourceType: 'product',
            saleUnitId: matchedSaleUnit ? matchedSaleUnit.id : null,
            saleUnitName: suName,
            conversionQty: matchedSaleUnit ? Number(matchedSaleUnit.conversion_qty) : 1,
            sale_units: allSaleUnits,
            price: finalPrice,
            selling_price: finalPrice,
            displayName,
          },
        };
      }
    } catch (e) {
      console.error('[barcodeService] Product lookup error:', e);
    }

    // 4. Cek di tabel product_submissions (pengajuan barang baru)
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

    // 5. Cek di tabel unregistered_prices
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

    // 6. Fallback: Cek pencarian nama produk jika barcode / kode tidak ditemukan persis
    try {
      const { data: byName, error: nameErr } = await supabase
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
        .ilike('name', `%${barcode}%`)
        .eq('status', true)
        .limit(1);

      if (!nameErr && byName && byName.length > 0) {
        const product = byName[0];
        let displayName = product.name;

        return {
          found: true,
          type: 'product',
          data: {
            ...product,
            productId: product.id,
            sourceType: 'product',
            saleUnitId: null,
            saleUnitName: null,
            conversionQty: 1,
            price: Number(product.selling_price || 0),
            selling_price: Number(product.selling_price || 0),
            displayName,
          },
        };
      }
    } catch (e) {
      console.warn('[barcodeService] Name fallback lookup error:', e);
    }

    // 7. Tidak ditemukan sama sekali
    return {
      found: false,
      type: 'not_found',
      barcode,
    };
  },
};

export default barcodeService;
