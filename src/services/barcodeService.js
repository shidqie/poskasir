import { supabase } from '@/lib/supabase';

// In-memory LRU-style short cache to accelerate repeated scans (instant 0ms response)
const barcodeCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 menit

export const barcodeService = {
  /**
   * Mencari produk berdasarkan barcode / kode barang secara super cepat (Paralel Network & Hardware Optimized)
   */
  async lookupBarcode(rawBarcode) {
    if (!rawBarcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    const barcode = String(rawBarcode).trim();
    if (!barcode) {
      return { found: false, type: 'not_found', barcode: '' };
    }

    // 0. Cek In-Memory Cache untuk respon instan (0ms)
    const cached = barcodeCache.get(barcode);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      // 1. Eksekusi 3 Query Utama Secara PARALEL (1 Roundtrip Jaringan Cepat 30-60ms)
      const [saleUnitRes, variantRes, productRes] = await Promise.all([
        // Query A: Cek Satuan Penjualan (product_sale_units)
        supabase
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
            product:products(
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
          .or(`barcode.eq.${barcode},barcode.ilike.${barcode}`)
          .eq('status', true)
          .limit(3),

        // Query B: Cek Varian Produk (product_variants)
        supabase
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
            unit_id,
            unit:units(id, name, symbol, allow_decimal),
            product:products(
              id,
              name,
              code,
              barcode,
              category_id,
              status,
              unit:units(id, name, symbol, allow_decimal)
            )
          `)
          .or(`barcode.eq.${barcode},barcode.ilike.${barcode},code.ilike.${barcode}`)
          .eq('status', true)
          .limit(3),

        // Query C: Cek Produk Utama (products)
        supabase
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
          .or(`barcode.eq.${barcode},barcode.ilike.${barcode},code.ilike.${barcode}`)
          .eq('status', true)
          .limit(3),
      ]);

      // HASIL A: Cocok di Satuan Penjualan Khusus (Dus / Renceng)
      if (saleUnitRes.data && saleUnitRes.data.length > 0) {
        const activeSu = saleUnitRes.data.find((su) => su.product && su.product.status !== false);
        if (activeSu) {
          const p = activeSu.product;
          const v = activeSu.variant;
          const isVariant = Boolean(v && v.status !== false);

          const baseStock = isVariant ? Number(v.stock || 0) : Number(p.stock || 0);
          const baseUnit = (isVariant && v.unit) ? v.unit : (p.unit || { symbol: 'Pcs', allow_decimal: false });
          const pName = p.name;
          const vName = isVariant ? v.variant_name : null;
          const suName = activeSu.name;

          let displayName = pName;
          if (vName) displayName += ` - ${vName}`;
          if (suName) displayName += ` (${suName})`;

          const result = {
            found: true,
            type: 'product',
            data: {
              sourceType: 'product',
              id: p.id,
              productId: p.id,
              variantId: isVariant ? v.id : null,
              saleUnitId: activeSu.id,
              saleUnitName: suName,
              conversionQty: Number(activeSu.conversion_qty) || 1,
              name: pName,
              productName: pName,
              variantName: vName,
              displayName,
              selling_price: Number(activeSu.selling_price) || 0,
              price: Number(activeSu.selling_price) || 0,
              stock: baseStock,
              minimum_stock: isVariant ? Number(v.minimum_stock || 0) : Number(p.minimum_stock || 0),
              code: isVariant ? (v.code || p.code) : p.code,
              barcode: activeSu.barcode || (isVariant ? v.barcode : p.barcode),
              unit: baseUnit,
              allowDecimal: Boolean(baseUnit.allow_decimal),
            },
          };

          barcodeCache.set(barcode, { result, timestamp: Date.now() });
          return result;
        }
      }

      // HASIL B: Cocok di Varian Produk
      if (variantRes.data && variantRes.data.length > 0) {
        const activeVariant = variantRes.data.find((v) => v.product && v.product.status !== false);
        if (activeVariant) {
          const variant = activeVariant;

          // Ambil sale units untuk varian jika ada
          let matchedSaleUnit = null;
          try {
            const { data: suList } = await supabase
              .from('product_sale_units')
              .select('*')
              .eq('product_id', variant.product.id)
              .eq('variant_id', variant.id)
              .eq('status', true)
              .order('is_default', { ascending: false });

            if (suList && suList.length > 0) {
              matchedSaleUnit = suList.find((s) => s.is_default) || suList[0];
            }
          } catch (e) {}

          const finalPrice = matchedSaleUnit ? Number(matchedSaleUnit.selling_price) : Number(variant.selling_price || 0);
          const suName = matchedSaleUnit ? matchedSaleUnit.name : null;
          let displayName = `${variant.product.name} - ${variant.variant_name}`;
          if (suName) displayName += ` (${suName})`;

          const result = {
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
              unit: variant.unit || variant.product?.unit || { symbol: 'Pcs', allow_decimal: false },
              allowDecimal: Boolean(
                variant.unit?.allow_decimal || variant.product?.unit?.allow_decimal
              ),
            },
          };

          barcodeCache.set(barcode, { result, timestamp: Date.now() });
          return result;
        }
      }

      // HASIL C: Cocok di Produk Utama
      if (productRes.data && productRes.data.length > 0) {
        const product = productRes.data[0];

        // Ambil data varian & satuan secara paralel
        const [vListRes, suListRes] = await Promise.all([
          product.has_variants
            ? supabase
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
                  unit:units(id, name, symbol, allow_decimal)
                `)
                .eq('product_id', product.id)
                .eq('status', true)
            : Promise.resolve({ data: [] }),
          supabase
            .from('product_sale_units')
            .select('*')
            .eq('product_id', product.id)
            .is('variant_id', null)
            .eq('status', true)
            .order('is_default', { ascending: false }),
        ]);

        const allSaleUnits = suListRes.data || [];
        const matchedSaleUnit = allSaleUnits.find((s) => s.is_default) || (allSaleUnits.length === 1 ? allSaleUnits[0] : null);
        const finalPrice = matchedSaleUnit ? Number(matchedSaleUnit.selling_price) : Number(product.selling_price || 0);
        const suName = matchedSaleUnit ? matchedSaleUnit.name : null;
        let displayName = product.name;
        if (suName) displayName += ` (${suName})`;

        const result = {
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
            product_variants: vListRes.data || [],
            price: finalPrice,
            selling_price: finalPrice,
            displayName,
          },
        };

        barcodeCache.set(barcode, { result, timestamp: Date.now() });
        return result;
      }

      // 2. Fallback: Cek Submissions & Unregistered Secara Paralel
      const [subRes, unregRes] = await Promise.all([
        supabase
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
          .or(`barcode.eq.${barcode},barcode.ilike.${barcode}`)
          .limit(1),
        supabase
          .from('unregistered_prices')
          .select('*')
          .eq('barcode', barcode)
          .eq('status', 'pending')
          .maybeSingle(),
      ]);

      if (subRes.data && subRes.data.length > 0) {
        const sub = subRes.data[0];
        const result = {
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
        barcodeCache.set(barcode, { result, timestamp: Date.now() });
        return result;
      }

      if (unregRes.data) {
        const result = {
          found: true,
          type: 'temporary',
          data: {
            ...unregRes.data,
            sourceType: 'temporary',
          },
        };
        barcodeCache.set(barcode, { result, timestamp: Date.now() });
        return result;
      }

      // 3. Fallback Nama Produk
      const { data: byName } = await supabase
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
        .or(`name.ilike.%${barcode}%,code.ilike.%${barcode}%`)
        .eq('status', true)
        .limit(1);

      if (byName && byName.length > 0) {
        const product = byName[0];
        const result = {
          found: true,
          type: 'product',
          data: {
            ...product,
            productId: product.id,
            sourceType: 'product',
            product_variants: [],
            saleUnitId: null,
            saleUnitName: null,
            conversionQty: 1,
            price: Number(product.selling_price || 0),
            selling_price: Number(product.selling_price || 0),
            displayName: product.name,
          },
        };
        barcodeCache.set(barcode, { result, timestamp: Date.now() });
        return result;
      }
    } catch (e) {
      console.error('[barcodeService] Error parallel barcode lookup:', e);
    }

    return {
      found: false,
      type: 'not_found',
      barcode,
    };
  },
};

export default barcodeService;
