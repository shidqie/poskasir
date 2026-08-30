import { supabase } from '@/lib/supabase';

export const unitService = {
  /**
   * Mengambil semua data satuan
   */
  async getUnits({ onlyActive = false } = {}) {
    let query = supabase
      .from('units')
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
   * Menambah satuan baru
   */
  async createUnit({ name, symbol, allow_decimal = false }) {
    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();

    if (!trimmedName) throw new Error('Nama satuan wajib diisi.');
    if (!trimmedSymbol) throw new Error('Simbol satuan wajib diisi.');

    // Cek duplikasi nama
    const { data: existingName } = await supabase
      .from('units')
      .select('id')
      .ilike('name', trimmedName)
      .maybeSingle();

    if (existingName) {
      throw new Error(`Satuan "${trimmedName}" sudah ada.`);
    }

    const { data, error } = await supabase
      .from('units')
      .insert([
        {
          name: trimmedName,
          symbol: trimmedSymbol,
          allow_decimal: Boolean(allow_decimal),
          status: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengubah data satuan
   */
  async updateUnit(id, { name, symbol, allow_decimal, status }) {
    const updateData = {};
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error('Nama satuan tidak boleh kosong.');

      const { data: existingName } = await supabase
        .from('units')
        .select('id')
        .ilike('name', trimmedName)
        .neq('id', id)
        .maybeSingle();

      if (existingName) {
        throw new Error(`Satuan "${trimmedName}" sudah digunakan.`);
      }

      updateData.name = trimmedName;
    }

    if (symbol !== undefined) {
      const trimmedSymbol = symbol.trim();
      if (!trimmedSymbol) throw new Error('Simbol satuan tidak boleh kosong.');
      updateData.symbol = trimmedSymbol;
    }

    if (allow_decimal !== undefined) {
      updateData.allow_decimal = Boolean(allow_decimal);
    }

    if (status !== undefined) {
      updateData.status = Boolean(status);
    }

    const { data, error } = await supabase
      .from('units')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Toggle status satuan
   */
  async toggleUnitStatus(id, currentStatus) {
    return this.updateUnit(id, { status: !currentStatus });
  },

  /**
   * Hapus satuan dari database
   */
  async deleteUnit(id) {
    // Cek apakah ada produk yang masih memakai satuan ini
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('unit_id', id);

    if (countError) console.warn('Check unit products usage warning:', countError);

    if (count && count > 0) {
      throw new Error(`Satuan tidak dapat dihapus karena masih digunakan oleh ${count} produk.`);
    }

    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },
};

export default unitService;
