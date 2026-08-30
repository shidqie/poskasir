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

    // Hitung penjualan, pembayaran hutang, serta kas masuk & keluar real-time
    const stats = await this.getSessionRealtimeStats(data.id, data.cashier_id, data.opened_at);

    const openingCash = Number(data.opening_cash || 0);
    const cashSales = Number(stats.cash_sales || 0);
    const cashDebtPayments = Number(stats.cash_debt_payments || 0);
    const cashIn = Number(stats.cash_in || 0);
    const cashOut = Number(stats.cash_out || 0);

    // Saldo Tunai Seharusnya = Saldo Awal + Penjualan Tunai + Setoran Tunai + Kas Masuk - Kas Keluar
    const expectedCash = openingCash + cashSales + cashDebtPayments + cashIn - cashOut;

    return {
      ...data,
      ...stats,
      expected_cash: expectedCash,
      total_sales: cashSales + Number(stats.qris_sales || 0) + Number(stats.debt_sales || 0),
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
   * Mengambil statistik real-time transaksi, setoran hutang, dan kas masuk/keluar
   */
  async getSessionRealtimeStats(sessionId, cashierId = null, openedAt = null) {
    // 1. Ambil transaksi penjualan
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
    }

    // 2. Ambil penerimaan pembayaran hutang pada sesi ini
    let payQuery = supabase
      .from('debt_payments')
      .select('amount, payment_method, payment_date');

    if (sessionId) {
      payQuery = payQuery.eq('cashier_session_id', sessionId);
    } else if (openedAt) {
      payQuery = payQuery.gte('payment_date', openedAt);
    }

    const { data: payments = [], error: payErr } = await payQuery;
    if (payErr) {
      console.warn('[cashierSessionService] getSessionRealtimeStats payErr:', payErr);
    }

    // 3. Ambil pergerakan kas masuk & kas keluar pada sesi ini
    let moveQuery = supabase
      .from('cash_movements')
      .select('amount, movement_type, created_at');

    if (sessionId) {
      moveQuery = moveQuery.eq('cashier_session_id', sessionId);
    } else if (openedAt) {
      moveQuery = moveQuery.gte('created_at', openedAt);
    }

    const { data: movements = [], error: moveErr } = await moveQuery;
    if (moveErr) {
      console.warn('[cashierSessionService] getSessionRealtimeStats moveErr:', moveErr);
    }

    const cashTxs = (txs || []).filter((t) => t.payment_method === 'cash');
    const qrisTxs = (txs || []).filter((t) => t.payment_method === 'qris' || t.payment_method === 'transfer');
    const debtTxs = (txs || []).filter((t) => t.payment_method === 'debt');

    const cash_sales = cashTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const qris_sales = qrisTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const debt_sales = debtTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const total_sales = cash_sales + qris_sales + debt_sales;

    const cashDebtPayments = (payments || [])
      .filter((p) => p.payment_method === 'cash')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const qrisDebtPayments = (payments || [])
      .filter((p) => p.payment_method === 'qris' || p.payment_method === 'transfer')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const total_debt_payments = cashDebtPayments + qrisDebtPayments;

    const cash_in = (movements || [])
      .filter((m) => m.movement_type === 'cash_in')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);

    const cash_out = (movements || [])
      .filter((m) => m.movement_type === 'cash_out')
      .reduce((sum, m) => sum + Number(m.amount || 0), 0);

    return {
      cash_sales,
      qris_sales,
      debt_sales,
      total_sales,
      cash_debt_payments: cashDebtPayments,
      qris_debt_payments: qrisDebtPayments,
      total_debt_payments,
      cash_in,
      cash_out,
      transaction_count: (txs || []).length,
      cash_tx_count: cashTxs.length,
      qris_tx_count: qrisTxs.length,
      debt_tx_count: debtTxs.length,
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
