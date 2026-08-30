import { supabase } from '@/lib/supabase';

export const productService = {
  /**
   * Mengambil daftar barang dengan filter & pencarian
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
        unit:units(id, name, symbol, allow_decimal)
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

    // Pencarian nama / kode / barcode
    if (search.trim()) {
      const term = search.trim();
      query = query.or(
        `name.ilike.%${term}%,code.ilike.%${term}%,barcode.ilike.%${term}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    let results = data || [];

    // Filter Stok pada client-side
    if (stockFilter === 'available') {
      results = results.filter((p) => Number(p.stock) > Number(p.minimum_stock || 0));
    } else if (stockFilter === 'low') {
      results = results.filter(
        (p) =>
          Number(p.stock) > 0 &&
          Number(p.minimum_stock) > 0 &&
          Number(p.stock) <= Number(p.minimum_stock)
      );
    } else if (stockFilter === 'out_of_stock') {
      results = results.filter((p) => Number(p.stock) <= 0);
    }

    return results;
  },

  /**
   * Mengambil satu produk berdasarkan ID
   */
  async getProductById(id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(id, name),
        unit:units(id, name, symbol, allow_decimal)
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

    // Fallback jika RPC belum ada di database
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

    let query = supabase
      .from('products')
      .select('id, name')
      .eq('barcode', barcode.trim());

    if (excludeProductId) {
      query = query.neq('id', excludeProductId);
    }

    const { data } = await query.maybeSingle();
    return data;
  },

  /**
   * Menambah barang baru
   */
  async createProduct({
    name,
    code,
    barcode,
    category_id,
    unit_id,
    selling_price,
    stock = 0,
    minimum_stock = 0,
    status = true,
  }) {
    const trimmedName = name?.trim();
    if (!trimmedName) throw new Error('Nama barang wajib diisi.');
    if (!category_id) throw new Error('Kategori wajib dipilih.');
    if (!unit_id) throw new Error('Satuan wajib dipilih.');
    if (Number(selling_price) < 0) throw new Error('Harga jual tidak boleh bernilai negatif.');
    if (Number(stock) < 0) throw new Error('Jumlah stok tidak boleh bernilai negatif.');
    if (Number(minimum_stock) < 0) throw new Error('Stok minimum tidak boleh bernilai negatif.');

    const trimmedBarcode = barcode?.trim() || null;

    // Validasi Barcode unik jika diisi
    if (trimmedBarcode) {
      const existingProduct = await this.checkBarcodeExists(trimmedBarcode);
      if (existingProduct) {
        throw new Error(
          `Barcode "${trimmedBarcode}" sudah digunakan oleh barang "${existingProduct.name}".`
        );
      }
    }

    // Generate kode jika tidak disediakan
    const productCode = code?.trim() || (await this.getNextProductCode());

    // Ambil user ID aktif
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const insertData = {
      name: trimmedName,
      code: productCode,
      barcode: trimmedBarcode,
      category_id,
      unit_id,
      selling_price: Number(selling_price) || 0,
      stock: Number(stock) || 0,
      minimum_stock: Number(minimum_stock) || 0,
      status: Boolean(status),
      created_by: user?.id || null,
      updated_by: user?.id || null,
    };

    const { data, error } = await supabase
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

    return data;
  },

  /**
   * Mengubah data barang
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
            `Barcode "${trimmedBarcode}" sudah digunakan oleh barang "${existing.name}".`
          );
        }
      }
      updateData.barcode = trimmedBarcode;
    }

    if (category_id !== undefined) updateData.category_id = category_id;
    if (unit_id !== undefined) updateData.unit_id = unit_id;
    if (selling_price !== undefined) {
      if (Number(selling_price) < 0) throw new Error('Harga jual tidak boleh negatif.');
      updateData.selling_price = Number(selling_price);
    }
    if (stock !== undefined) {
      if (Number(stock) < 0) throw new Error('Stok tidak boleh negatif.');
      updateData.stock = Number(stock);
    }
    if (minimum_stock !== undefined) {
      if (Number(minimum_stock) < 0) throw new Error('Stok minimum tidak boleh negatif.');
      updateData.minimum_stock = Number(minimum_stock);
    }
    if (status !== undefined) updateData.status = Boolean(status);

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
        unit:units(id, name, symbol, allow_decimal)
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
