import { supabase } from '@/lib/supabase';

export const closingService = {
  /**
   * Mengambil shift / closing hari ini untuk kasir tertentu
   */
  async getTodayShift(cashierId) {
    if (!cashierId) {
      const { data: { user } } = await supabase.auth.getUser();
      cashierId = user?.id;
    }
    if (!cashierId) return null;

    const today = new Date().toISOString().split('T')[0];

    // Cek shift kasir untuk hari ini
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('cashier_id', cashierId)
      .eq('closing_date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[closingService] getTodayShift warning:', error);
      return null;
    }
    return data;
  },

  /**
   * Alias untuk getTodayClosing agar backward compatible
   */
  async getTodayClosing(cashierId) {
    return this.getTodayShift(cashierId);
  },

  /**
   * Buka Kasir (Memulai shift baru dengan modal awal)
   */
  async openShift({ cashierId, openingCash = 0, notes = '' }) {
    if (!cashierId) {
      const { data: { user } } = await supabase.auth.getUser();
      cashierId = user?.id;
    }
    if (!cashierId) throw new Error('Pengguna tidak terautentikasi.');

    const today = new Date().toISOString().split('T')[0];
    const initialCash = Number(openingCash) || 0;

    const payload = {
      cashier_id: cashierId,
      closing_date: today,
      opening_cash: initialCash,
      status: 'open',
      opened_at: new Date().toISOString(),
      transaction_count: 0,
      total_sales: 0,
      system_cash: initialCash,
      actual_cash: 0,
      notes: notes?.trim() || 'Shift kasir dibuka',
    };

    const { data, error } = await supabase
      .from('cash_closings')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[closingService] openShift error:', error);
      throw new Error(error.message || 'Gagal membuka shift kasir.');
    }

    return data;
  },

  /**
   * Tutup Kasir (Menyelesaikan shift kasir dengan rekonsiliasi uang fisik)
   */
  async closeShift({
    shiftId,
    cashierId,
    transactionCount = 0,
    totalSales = 0,
    cashSales = 0,
    nonCashSales = 0,
    systemCash = 0,
    actualCash = 0,
    openingCash = 0,
    notes = '',
  }) {
    if (!cashierId) {
      const { data: { user } } = await supabase.auth.getUser();
      cashierId = user?.id;
    }
    if (!cashierId) throw new Error('Pengguna tidak terautentikasi.');

    const today = new Date().toISOString().split('T')[0];
    const actual = Number(actualCash) || 0;
    const total = Number(totalSales) || 0;
    const cash = Number(cashSales) || 0;
    const nonCash = Number(nonCashSales) || 0;
    const opening = Number(openingCash) || 0;
    const calculatedSystemCash = opening + cash;

    const updatePayload = {
      status: 'closed',
      closed_at: new Date().toISOString(),
      transaction_count: Number(transactionCount) || 0,
      total_sales: total,
      cash_sales: cash,
      non_cash_sales: nonCash,
      system_cash: calculatedSystemCash,
      actual_cash: actual,
      notes: notes?.trim() || null,
    };

    let result;

    if (shiftId) {
      const { data, error } = await supabase
        .from('cash_closings')
        .update(updatePayload)
        .eq('id', shiftId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Jika belum ada shift record, buat langsung record closed
      const insertPayload = {
        ...updatePayload,
        cashier_id: cashierId,
        closing_date: today,
        opening_cash: opening,
      };

      const { data, error } = await supabase
        .from('cash_closings')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  },

  /**
   * Alias createClosing agar backward compatible
   */
  async createClosing(params) {
    return this.closeShift(params);
  },

  /**
   * Mengambil rincian penjualan kasir hari ini (Tunai vs Non-Tunai)
   */
  async getShiftSalesBreakdown(cashierId) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    let query = supabase
      .from('transactions')
      .select('total_amount, payment_method, total_quantity, change_amount, payment_amount')
      .eq('status', 'completed')
      .gte('transaction_date', startOfDay)
      .lt('transaction_date', endOfDay);

    if (cashierId) {
      query = query.eq('cashier_id', cashierId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const txs = data || [];
    const transactionCount = txs.length;
    const totalRevenue = txs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const cashSales = txs
      .filter((t) => t.payment_method === 'cash')
      .reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const qrisSales = txs
      .filter((t) => t.payment_method === 'qris')
      .reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const transferSales = txs
      .filter((t) => t.payment_method === 'transfer')
      .reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const nonCashSales = qrisSales + transferSales;

    return {
      transactionCount,
      totalRevenue,
      cashSales,
      qrisSales,
      transferSales,
      nonCashSales,
    };
  },

  /**
   * Daftar semua closing untuk Owner
   */
  async getAllClosings({ dateFrom = '', dateTo = '' } = {}) {
    let query = supabase
      .from('cash_closings')
      .select(`
        *,
        cashier:profiles!cashier_id(id, full_name)
      `)
      .order('closing_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('closing_date', dateFrom);
    if (dateTo) query = query.lte('closing_date', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

export default closingService;
