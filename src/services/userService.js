import { supabase } from '@/lib/supabase';

export const userService = {
  /**
   * Ambil semua kasir (profiles dengan role cashier)
   */
  async getCashiers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, status, created_at')
      .eq('role', 'cashier')
      .order('full_name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Toggle status aktif/nonaktif kasir
   */
  async toggleCashierStatus(id, newStatus) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buat kasir baru via Supabase Auth signUp
   * Catatan: ini akan membuat user baru dan trigger otomatis akan membuat profile
   */
  async createCashier({ email, password, fullName }) {
    // Buat akun di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'cashier',
        },
      },
    });

    if (authError) throw authError;

    // Buat/update profile dengan role cashier
    if (authData?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          role: 'cashier',
          status: true,
        });

      if (profileError) throw profileError;
    }

    return authData;
  },
};

export default userService;
