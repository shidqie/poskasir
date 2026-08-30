import { supabase } from '@/lib/supabase';

export const productService = {
  /**
   * Mengambil daftar barang dengan filter & pencarian (termasuk varian)
   */
  async getProducts({
    search = '',
    categoryId = '',
    status = '',
    stockFilter = '', // 'all' | 'available' | 'low' | 'out_of_stock'
  } = {}) {
    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal),
        product_variants:product_variants(
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
      .order('created_at', { ascending: false });

    // Filter Kategori
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filter Status
    if (status !== '' && status !== 'all') {
      query = query.eq('status', status === 'true' || status === true);
    }

    // Pencarian nama / kode / barcode produk
    if (search.trim()) {
      const term = search.trim();
      query = query.or(
        `name.ilike.%${term}%,code.ilike.%${term}%,barcode.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];

    // Jika search tidak cocok pada nama produk, cek apakah cocok pada nama/barcode varian
    if (search.trim()) {
      const termLower = search.trim().toLowerCase();
      // Pastikan produk yang punya varian cocok juga diikutsertakan
      const { data: matchedVariants } = await supabase
        .from('product_variants')
        .select('product_id')
        .or(`variant_name.ilike.%${search.trim()}%,code.ilike.%${search.trim()}%,barcode.ilike.%${search.trim()}%`);

      if (matchedVariants && matchedVariants.length > 0) {
        const extraProductIds = matchedVariants.map((v) => v.product_id);
        const missingIds = extraProductIds.filter((pid) => !results.some((r) => r.id === pid));

        if (missingIds.length > 0) {
          const { data: extraProducts } = await supabase
            .from('products')
            .select(`
              *,
              category:categories(id, name),
              unit:units(id, name, symbol, allow_decimal),
              product_variants:product_variants(
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
            .in('id', missingIds);

          if (extraProducts) {
            results = [...results, ...extraProducts];
          }
        }
      }
    }

    // Filter Stok pada client-side dengan memperhitungkan stok varian
    if (stockFilter === 'available') {
      results = results.filter((p) => {
        if (p.has_variants && p.product_variants?.length > 0) {
          const totalStock = p.product_variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
          return totalStock > 0;
        }
        return Number(p.stock) > Number(p.minimum_stock || 0);
      });
    } else if (stockFilter === 'low') {
      results = results.filter((p) => {
        if (p.has_variants && p.product_variants?.length > 0) {
          return p.product_variants.some(
            (v) =>
              Number(v.stock) > 0 &&
              Number(v.minimum_stock) > 0 &&
              Number(v.stock) <= Number(v.minimum_stock)
          );
        }
        return (
          Number(p.stock) > 0 &&
          Number(p.minimum_stock) > 0 &&
          Number(p.stock) <= Number(p.minimum_stock)
        );
      });
    } else if (stockFilter === 'out_of_stock') {
      results = results.filter((p) => {
        if (p.has_variants && p.product_variants?.length > 0) {
          const totalStock = p.product_variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);
          return totalStock <= 0;
        }
        return Number(p.stock) <= 0;
      });
    }

    return results;
  },

  /**
   * Mengambil satu produk berdasarkan ID beserta seluruh variannya
   */
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal),
        product_variants:product_variants(
          id,
          variant_name,
          code,
          barcode,
          selling_price,
          stock,
          minimum_stock,
          status,
          unit_id,
          unit:units(id, name, symbol, allow_decimal)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Menghasilkan kode barang otomatis berikutnya
   */
  async getNextProductCode() {
    try {
      const { data, error } = await supabase.rpc('generate_product_code');
      if (!error && data) return data;
    } catch (e) {
      console.warn('[ProductService] Fallback generate code:', e);
    }

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    const nextNumber = (count || 0) + 1;
    return `BRG-${String(nextNumber).padStart(4, '0')}`;
  },

  /**
   * Memeriksa apakah barcode sudah digunakan
   */
  async checkBarcodeExists(barcode, excludeProductId = null) {
    if (!barcode || !barcode.trim()) return false;

    // Cek di products
    let query = supabase
      .from('products')
      .select('id, name')
      .eq('barcode', barcode.trim());

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data } = await query.maybeSingle();
    if (data) return data;

    // Cek di product_variants
    const { data: variantData } = await supabase
      .from('product_variants')
      .select('id, variant_name, product:products(name)')
      .eq('barcode', barcode.trim())
      .maybeSingle();

    if (variantData) {
      return {
        id: variantData.id,
        name: `${variantData.product?.name || 'Produk'} (${variantData.variant_name})`,
      };
    }

    return false;
  },

  /**
   * Menambah barang baru (dengan atau tanpa varian)
   */
  async createProduct({
    name,
    code,
    barcode,
    category_id,
    unit_id,
    selling_price = 0,
    stock = 0,
    minimum_stock = 0,
    status = true,
    has_variants = false,
    variants = [],
  }) {
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Nama barang wajib diisi.');
    if (!category_id) throw new Error('Kategori wajib dipilih.');
    if (!unit_id) throw new Error('Satuan wajib dipilih.');

    if (has_variants) {
      if (!variants || variants.length === 0) {
        throw new Error('Produk dengan varian harus memiliki minimal 1 varian.');
      }
    } else {
      if (Number(selling_price) < 0) throw new Error('Harga jual tidak boleh bernilai negatif.');
      if (Number(stock) < 0) throw new Error('Jumlah stok tidak boleh bernilai negatif.');
      if (Number(minimum_stock) < 0) throw new Error('Stok minimum tidak boleh bernilai negatif.');
    }

    const trimmedBarcode = barcode?.trim() || null;

    // Validasi Barcode unik jika diisi
    if (trimmedBarcode) {
      const existingProduct = await this.checkBarcodeExists(trimmedBarcode);
      if (existingProduct) {
        throw new Error(
          `Barcode "${trimmedBarcode}" sudah digunakan oleh "${existingProduct.name}".`
        );
      }
    }

    const productCode = code?.trim() || (await this.getNextProductCode());

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
      name: trimmedName,
      code: productCode,
      barcode: trimmedBarcode,
      category_id,
      unit_id,
      selling_price: has_variants ? 0 : Number(selling_price) || 0,
      stock: has_variants ? 0 : Number(stock) || 0,
      minimum_stock: has_variants ? 0 : Number(minimum_stock) || 0,
      status: Boolean(status),
      has_variants: Boolean(has_variants),
      created_by: user?.id || null,
      updated_by: user?.id || null,
    };

    const { data: createdProduct, error } = await supabase
      .from('products')
      .insert([insertData])
      .select(`
        *,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal)
      `)
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('code')) {
        throw new Error(`Kode barang "${productCode}" sudah ada di sistem.`);
      }
      if (error.code === '23505' && error.message.includes('barcode')) {
        throw new Error(`Barcode "${trimmedBarcode}" sudah digunakan oleh barang lain.`);
      }
      throw error;
    }

    // Jika memiliki varian, simpan seluruh varian
    if (has_variants && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vCode = v.code || `${productCode}-V${i + 1}`;
        await supabase.from('product_variants').insert({
          product_id: createdProduct.id,
          variant_name: v.variant_name.trim(),
          code: vCode,
          barcode: v.barcode?.trim() || null,
          selling_price: Number(v.selling_price) || 0,
          stock: Number(v.stock) || 0,
          minimum_stock: Number(v.minimum_stock) || 0,
          unit_id: v.unit_id || unit_id,
          status: v.status !== undefined ? v.status : true,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        });
      }
    }

    return createdProduct;
  },

  /**
   * Mengubah data produk utama
   */
  async updateProduct(
    id,
    {
      name,
      barcode,
      category_id,
      unit_id,
      selling_price,
      stock,
      minimum_stock,
      status,
      has_variants,
    }
  ) {
    const updateData = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error('Nama barang tidak boleh kosong.');
      updateData.name = trimmedName;
    }

    if (barcode !== undefined) {
      const trimmedBarcode = barcode ? barcode.trim() : null;
      if (trimmedBarcode) {
        const existing = await this.checkBarcodeExists(trimmedBarcode, id);
        if (existing) {
          throw new Error(
            `Barcode "${trimmedBarcode}" sudah digunakan oleh "${existing.name}".`
          );
        }
      }
      updateData.barcode = trimmedBarcode;
    }

    if (category_id !== undefined) updateData.category_id = category_id;
    if (unit_id !== undefined) updateData.unit_id = unit_id;
    if (selling_price !== undefined) updateData.selling_price = Number(selling_price);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (minimum_stock !== undefined) updateData.minimum_stock = Number(minimum_stock);
    if (status !== undefined) updateData.status = Boolean(status);
    if (has_variants !== undefined) updateData.has_variants = Boolean(has_variants);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    updateData.updated_by = user?.id || null;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal),
        product_variants:product_variants(
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
      .single();

    if (error) {
      if (error.code === '23505' && error.message.includes('barcode')) {
        throw new Error(`Barcode sudah digunakan oleh barang lain.`);
      }
      throw error;
    }

    return data;
  },

  /**
   * Toggle status aktif/nonaktif barang
   */
  async toggleProductStatus(id, currentStatus) {
    return this.updateProduct(id, { status: !currentStatus });
  },
};

export default productService;
