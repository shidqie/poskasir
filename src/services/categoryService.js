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
};

export default categoryService;
