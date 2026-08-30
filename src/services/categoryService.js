import { supabase } from '@/lib/supabase';

export const categoryService = {
  /**
   * Mengambil semua kategori
   */
  async getCategories({ onlyActive = false } = {}) {
    let query = supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('status', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Menambah kategori baru
   */
  async createCategory({ name }) {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error('Nama kategori wajib diisi.');

    // Cek duplikasi case-insensitive
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existing) {
      throw new Error(`Kategori "${trimmedName}" sudah ada.`);
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: trimmedName, status: true }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengubah nama atau status kategori
   */
  async updateCategory(id, { name, status }) {
    const updateData = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error('Nama kategori tidak boleh kosong.');

      // Cek duplikasi dengan kategori lain
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', trimmedName)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        throw new Error(`Kategori "${trimmedName}" sudah digunakan.`);
      }

      updateData.name = trimmedName;
    }

    if (status !== undefined) {
      updateData.status = Boolean(status);
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Toggle status aktif/nonaktif kategori
   */
  async toggleCategoryStatus(id, currentStatus) {
    return this.updateCategory(id, { status: !currentStatus });
  },

  /**
   * Hapus kategori dari database
   */
  async deleteCategory(id) {
    // Cek apakah ada produk yang masih memakai kategori ini
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) console.warn('Check category products usage warning:', countError);

    if (count && count > 0) {
      throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${count} produk.`);
    }

    // Cek apakah ada pengajuan barang yang memakai kategori ini
    const { count: subCount } = await supabase
      .from('product_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (subCount && subCount > 0) {
      // Lepas relasi pengajuan ke null
      await supabase
        .from('product_submissions')
        .update({ category_id: null })
        .eq('category_id', id);
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default categoryService;
