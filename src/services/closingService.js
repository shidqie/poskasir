import { supabase } from '@/lib/supabase';

export const closingService = {
  /**
   * Mengambil closing hari ini untuk kasir tertentu
   */
  async getTodayClosing(cashierId) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .eq('cashier_id', cashierId)
      .eq('closing_date', today)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /**
   * Menutup kasir hari ini
   */
  async createClosing({ cashierId, transactionCount, totalSales, systemCash, actualCash, notes }) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('cash_closings')
      .insert({
        cashier_id: cashierId,
        closing_date: today,
        transaction_count: transactionCount,
        total_sales: totalSales,
        system_cash: systemCash,
        actual_cash: actualCash,
        notes,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /**
   * Daftar semua closing (owner)
   */
  async getAllClosings({ dateFrom = '', dateTo = '' } = {}) {
    let query = supabase
      .from('cash_closings')
      .select(`
        *,
        cashier:profiles!cashier_id(id, full_name)
      `)
      .order('closing_date', { ascending: false });

    if (dateFrom) query = query.gte('closing_date', dateFrom);
    if (dateTo) query = query.lte('closing_date', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
};

export default closingService;
