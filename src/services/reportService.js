import { supabase } from '@/lib/supabase';

export const reportService = {
  /**
   * Mengambil ringkasan penjualan untuk rentang tanggal tertentu & metode pembayaran
   */
  async getSalesSummary({ dateFrom, dateTo, paymentMethod = 'all' } = {}) {
    let query = supabase
      .from('transactions')
      .select('total_amount, total_quantity, transaction_date, payment_method')
      .eq('status', 'completed');

    if (paymentMethod && paymentMethod !== 'all') {
      if (paymentMethod === 'qris') {
        query = query.or('payment_method.eq.qris,payment_method.eq.transfer');
      } else {
        query = query.eq('payment_method', paymentMethod);
      }
    }

    if (dateFrom) query = query.gte('transaction_date', dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setDate(end.getDate() + 1);
      query = query.lt('transaction_date', end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];
    const totalRevenue = transactions.reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const totalItemsSold = transactions.reduce((s, t) => s + Number(t.total_quantity || 0), 0);
    const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    const cashTxs = transactions.filter((t) => t.payment_method === 'cash');
    const qrisTxs = transactions.filter((t) => t.payment_method === 'qris' || t.payment_method === 'transfer');

    const cashRevenue = cashTxs.reduce((s, t) => s + Number(t.total_amount || 0), 0);
    const qrisRevenue = qrisTxs.reduce((s, t) => s + Number(t.total_amount || 0), 0);

    return {
      transactionCount: transactions.length,
      totalRevenue,
      cashRevenue,
      qrisRevenue,
      cashTxCount: cashTxs.length,
      qrisTxCount: qrisTxs.length,
      totalItemsSold,
      avgTransaction,
    };
  },

  /**
   * Penjualan per hari untuk grafik (7 / 14 hari terakhir)
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
        .select('total_amount, payment_method')
        .eq('status', 'completed')
        .gte('transaction_date', dayStart)
        .lt('transaction_date', dayEnd);

      if (!error && data) {
        const dayTotal = data.reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const dayCash = data.filter((t) => t.payment_method === 'cash').reduce((s, t) => s + Number(t.total_amount || 0), 0);
        const dayQris = data.filter((t) => t.payment_method === 'qris' || t.payment_method === 'transfer').reduce((s, t) => s + Number(t.total_amount || 0), 0);

        result.push({
          date: day.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }),
          total: dayTotal,
          cash: dayCash,
          qris: dayQris,
          count: data.length,
        });
      }
    }

    return result;
  },

  /**
   * Top Produk & Varian Terlaris
   */
  async getTopProducts(limit = 10) {
    const { data, error } = await supabase
      .from('transaction_items')
      .select('item_name, variant_name, sale_unit_name, unit_name, quantity, conversion_qty, subtotal')
      .order('quantity', { ascending: false })
      .limit(200);

    if (error) throw error;

    // Grouping by full name (item_name + variant_name + sale_unit_name)
    const grouped = (data || []).reduce((acc, item) => {
      let displayName = item.item_name;
      if (item.variant_name) displayName += ` - ${item.variant_name}`;
      if (item.sale_unit_name) displayName += ` (${item.sale_unit_name})`;

      if (!acc[displayName]) {
        acc[displayName] = {
          name: displayName,
          totalQty: 0,
          totalBaseQty: 0,
          totalRevenue: 0,
          unitName: item.sale_unit_name || item.unit_name || 'Pcs',
        };
      }
      const qty = Number(item.quantity) || 0;
      const conv = Number(item.conversion_qty) || 1;
      acc[displayName].totalQty += qty;
      acc[displayName].totalBaseQty += (qty * conv);
      acc[displayName].totalRevenue += Number(item.subtotal || 0);
      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  },

  /**
   * Performa Penjualan per Kasir
   */
  async getSalesByCashier() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        total_amount,
        cashier:profiles!cashier_id(id, full_name, email)
      `)
      .eq('status', 'completed');

    if (error) throw error;

    const grouped = (data || []).reduce((acc, t) => {
      const cashierName = t.cashier?.full_name || 'Kasir';
      const cashierId = t.cashier?.id || 'unknown';

      if (!acc[cashierId]) {
        acc[cashierId] = {
          id: cashierId,
          name: cashierName,
          totalRevenue: 0,
          transactionCount: 0,
        };
      }
      acc[cashierId].totalRevenue += Number(t.total_amount);
      acc[cashierId].transactionCount += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.totalRevenue - a.totalRevenue);
  },
};

export default reportService;
