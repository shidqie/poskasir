import { supabase } from '@/lib/supabase';

export const customerService = {
  /**
   * Mengambil daftar pelanggan dengan pencarian nama & nomor HP
   */
  async getCustomers({ search = '', limit = 100 } = {}) {
    let query = supabase
      .from('customers')
      .select('*')
      .eq('status', true)
      .order('name', { ascending: true })
      .limit(limit);

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      query = query.or(`name.ilike.${q},phone.ilike.${q}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mengambil detail pelanggan berdasarkan ID
   */
  async getCustomerById(id) {
    if (!id) return null;
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Membuat data pelanggan baru
   */
  async createCustomer({ name, phone = null, address = null, notes = null }) {
    if (!name || !name.trim()) {
      throw new Error('Nama pelanggan wajib diisi.');
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        notes: notes ? notes.trim() : null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengupdate data pelanggan
   */
  async updateCustomer(id, updates) {
    if (!id) throw new Error('ID pelanggan tidak valid.');

    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export default customerService;
