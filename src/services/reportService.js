import { supabase } from '@/lib/supabase';

export const reportService = {
  /**
   * Mengambil ringkasan penjualan untuk rentang tanggal tertentu
   */
  async getSalesSummary({ dateFrom, dateTo } = {}) {
    let query = supabase
      .from('transactions')
      .select('total_amount, total_quantity, transaction_date, payment_method')
      .eq('status', 'completed');

    if (dateFrom) query = query.gte('transaction_date', dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      query = query.lt('transaction_date', end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];
    const totalRevenue = transactions.reduce((s, t) => s + Number(t.total_amount), 0);
    const totalItemsSold = transactions.reduce((s, t) => s + Number(t.total_quantity), 0);
    const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    // Breakdown by payment method
    const byMethod = transactions.reduce((acc, t) => {
      acc[t.payment_method] = (acc[t.payment_method] || 0) + Number(t.total_amount);
      return acc;
    }, {});

    return {
      transactionCount: transactions.length,
      totalRevenue,
      totalItemsSold,
      avgTransaction,
      byMethod,
    };
  },

  /**
   * Penjualan per hari untuk grafik (7 hari terakhir)
   */
  async getDailySales(days = 7) {
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(day).toISOString();
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('transactions')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('transaction_date', dayStart)
        .lt('transaction_date', dayEnd);

      if (!error && data) {
        const dayTotal = data.reduce((s, t) => s + Number(t.total_amount), 0);
        result.push({
          date: day.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
          total: dayTotal,
          count: data.length,
        });
      }
    }

    return result;
  },

  /**
   * Barang & varian terlaris
   */
  async getTopProducts(limit = 10) {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('item_name, variant_name, quantity, subtotal, source_type')
      .limit(500);

    if (error) throw error;

    const grouped = (data || []).reduce((acc, item) => {
      const displayName = item.variant_name
        ? `${item.item_name} - ${item.variant_name}`
        : item.item_name;
      if (!acc[displayName]) acc[displayName] = { name: displayName, totalQty: 0, totalRevenue: 0 };
      acc[displayName].totalQty += Number(item.quantity);
      acc[displayName].totalRevenue += Number(item.subtotal);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  /**
   * Penjualan per kasir
   */
  async getSalesByCashier() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        cashier:profiles!cashier_id(id, full_name)
      `)
      .eq('status', 'completed');

    if (error) throw error;

    const grouped = (data || []).reduce((acc, t) => {
      const id = t.cashier?.id;
      const name = t.cashier?.full_name || 'Tidak diketahui';
      if (!acc[id]) acc[id] = { id, name, totalRevenue: 0, count: 0 };
      acc[id].totalRevenue += Number(t.total_amount);
      acc[id].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
};

export default reportService;
