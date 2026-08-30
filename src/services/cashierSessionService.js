import { supabase } from '@/lib/supabase';

export const cashierSessionService = {
  /**
   * Mengambil sesi kasir yang sedang aktif (status = 'open')
   */
  async getActiveSession(cashierId = null) {
    if (!cashierId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      cashierId = user?.id;
    }
    if (!cashierId) return null;

    const { data, error } = await supabase
      .from('cashier_sessions')
      .select('*')
      .eq('cashier_id', cashierId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[cashierSessionService] getActiveSession error:', error);
      return null;
    }

    if (!data) return null;

    // Hitung penjualan real-time untuk sesi yang sedang berjalan
    const stats = await this.getSessionRealtimeStats(data.id, data.cashier_id, data.opened_at);

    return {
      ...data,
      ...stats,
      expected_cash: Number(data.opening_cash || 0) + Number(stats.cash_sales || 0),
      total_sales: Number(stats.cash_sales || 0) + Number(stats.qris_sales || 0),
    };
  },

  /**
   * Buka Kasir (Memulai sesi baru dengan saldo awal tunai)
   */
  async openSession({ opening_cash = 0, notes = '' }) {
    const { data, error } = await supabase.rpc('open_cashier_session', {
      p_opening_cash: Number(opening_cash) || 0,
      p_notes: notes?.trim() || null,
    });

    if (error) {
      console.error('[cashierSessionService] open_cashier_session error:', error);
      throw new Error(error.message || 'Gagal membuka sesi kasir.');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Gagal membuka sesi kasir.');
    }

    return data.session;
  },

  /**
   * Tutup Kasir (Menyelesaikan sesi kasir dengan perhitungan database)
   */
  async closeSession({ session_id, actual_cash, notes = '' }) {
    const { data, error } = await supabase.rpc('close_cashier_session', {
      p_session_id: session_id,
      p_actual_cash: Number(actual_cash) || 0,
      p_notes: notes?.trim() || null,
    });

    if (error) {
      console.error('[cashierSessionService] close_cashier_session error:', error);
      throw new Error(error.message || 'Gagal menutup sesi kasir.');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Gagal menutup sesi kasir.');
    }

    return data;
  },

  /**
   * Mengambil statistik real-time transaksi pada sesi tertentu
   */
  async getSessionRealtimeStats(sessionId, cashierId = null, openedAt = null) {
    let query = supabase
      .from('transactions')
      .select('total_amount, payment_method, status, transaction_date')
      .eq('status', 'completed');

    if (sessionId) {
      query = query.or(`cashier_session_id.eq.${sessionId}${openedAt ? `,and(cashier_id.eq.${cashierId},transaction_date.gte.${openedAt})` : ''}`);
    } else if (cashierId && openedAt) {
      query = query.eq('cashier_id', cashierId).gte('transaction_date', openedAt);
    }

    const { data: txs = [], error } = await query;
    if (error) {
      console.warn('[cashierSessionService] getSessionRealtimeStats error:', error);
      return {
        cash_sales: 0,
        qris_sales: 0,
        total_sales: 0,
        transaction_count: 0,
        cash_tx_count: 0,
        qris_tx_count: 0,
      };
    }

    const cashTxs = (txs || []).filter((t) => t.payment_method === 'cash');
    const qrisTxs = (txs || []).filter((t) => t.payment_method === 'qris' || t.payment_method === 'transfer');

    const cash_sales = cashTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const qris_sales = qrisTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const total_sales = cash_sales + qris_sales;

    return {
      cash_sales,
      qris_sales,
      total_sales,
      transaction_count: (txs || []).length,
      cash_tx_count: cashTxs.length,
      qris_tx_count: qrisTxs.length,
    };
  },

  /**
   * Mengambil semua riwayat sesi kasir untuk Pemilik Toko
   */
  async getAllSessions({ dateFrom = '', dateTo = '', cashierId = '', status = 'all' } = {}) {
    let query = supabase
      .from('cashier_sessions')
      .select(`
        *,
        cashier:profiles!cashier_id(id, full_name, email, role)
      `)
      .order('opened_at', { ascending: false });

    if (status !== 'all' && status) {
      query = query.eq('status', status);
    }

    if (cashierId) {
      query = query.eq('cashier_id', cashierId);
    }

    if (dateFrom) {
      query = query.gte('opened_at', `${dateFrom}T00:00:00`);
    }

    if (dateTo) {
      query = query.lte('opened_at', `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

export default cashierSessionService;
