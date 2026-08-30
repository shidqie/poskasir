import { supabase } from '@/lib/supabase';

export const cashMovementService = {
  /**
   * Mencatat kas keluar (Ambil Uang) atau kas masuk melalui RPC record_cash_movement
   */
  async recordCashMovement({
    cashier_session_id,
    movement_type, // 'cash_out' | 'cash_in'
    amount,
    category,
    person_name,
    notes = null,
  }) {
    if (!cashier_session_id) throw new Error('Sesi kasir tidak valid.');
    if (!amount || Number(amount) <= 0) {
      throw new Error('Nominal uang harus lebih dari Rp 0.');
    }
    if (!person_name || !person_name.trim()) {
      throw new Error('Nama yang mengambil/menyetor uang wajib diisi.');
    }
    if (!category || !category.trim()) {
      throw new Error('Kategori keperluan wajib dipilih.');
    }

    const { data, error } = await supabase.rpc('record_cash_movement', {
      p_cashier_session_id: cashier_session_id,
      p_movement_type: movement_type,
      p_amount: Number(amount),
      p_category: category.trim(),
      p_person_name: person_name.trim(),
      p_notes: notes ? notes.trim() : null,
    });

    if (error) {
      console.error('[cashMovementService] record_cash_movement error:', error);
      throw new Error(error.message || 'Gagal mencatat pergerakan kas.');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Gagal mencatat pergerakan kas.');
    }

    return data;
  },

  /**
   * Mengambil riwayat pergerakan kas untuk sesi kasir tertentu
   */
  async getSessionCashMovements(sessionId) {
    if (!sessionId) return [];

    const { data, error } = await supabase
      .from('cash_movements')
      .select(`
        *,
        recorder:profiles!recorded_by(id, full_name, email)
      `)
      .eq('cashier_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[cashMovementService] getSessionCashMovements error:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Mengambil seluruh riwayat pergerakan kas (untuk Pemilik Toko)
   */
  async getAllCashMovements({
    dateFrom = '',
    dateTo = '',
    movementType = 'all',
    category = '',
    limit = 100,
  } = {}) {
    let query = supabase
      .from('cash_movements')
      .select(`
        *,
        recorder:profiles!recorded_by(id, full_name),
        session:cashier_sessions!cashier_session_id(
          id,
          opened_at,
          status,
          cashier:profiles!cashier_id(id, full_name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (movementType && movementType !== 'all') {
      query = query.eq('movement_type', movementType);
    }

    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

export default cashMovementService;
