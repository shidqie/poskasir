import { supabase } from '@/lib/supabase';

export const transactionService = {
  /**
   * Memanggil process_sale() RPC di Supabase
   * Semua validasi harga & stok dilakukan di sisi database
   */
  async processSale({ items, paymentAmount, paymentMethod = 'cash', idempotencyKey }) {
    const payload = items.map((item) => ({
      sourceType: item.sourceType,
      productId: item.productId || null,
      temporaryPriceId: item.temporaryPriceId || null,
      name: item.name,
      quantity: Number(item.quantity),
    }));

    const { data, error } = await supabase.rpc('process_sale', {
      p_items: payload,
      p_payment_amount: Number(paymentAmount),
      p_payment_method: paymentMethod,
      p_idempotency_key: idempotencyKey,
    });

    if (error) {
      console.error('[transactionService] RPC error:', error);
      throw new Error(error.message || 'Gagal memproses transaksi.');
    }

    if (!data || data.success === false) {
      throw new Error(data?.error || 'Transaksi gagal diproses oleh server.');
    }

    return data;
  },

  /**
   * Mengambil riwayat transaksi
   * Kasir: hanya miliknya. Owner: semua.
   */
  async getTransactions({ search = '', status = 'all', dateFrom = '', dateTo = '', cashierId = '' } = {}) {
    let query = supabase
      .from('transactions')
      .select(`
        id,
        transaction_number,
        transaction_date,
        total_quantity,
        total_amount,
        payment_amount,
        change_amount,
        payment_method,
        status,
        cashier:profiles!cashier_id (
          id,
          full_name
        )
      `)
      .order('transaction_date', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('transaction_date', dateFrom);
    }
    if (dateTo) {
      // Tambah 1 hari agar mencakup akhir hari
      const toDate = new Date(dateTo);
      toDate.setDate(toDate.getDate() + 1);
      query = query.lt('transaction_date', toDate.toISOString());
    }
    if (cashierId) {
      query = query.eq('cashier_id', cashierId);
    }
    if (search.trim()) {
      query = query.ilike('transaction_number', `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mengambil detail transaksi beserta item-itemnya
   */
  async getTransactionById(id) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        transaction_number,
        transaction_date,
        total_quantity,
        subtotal,
        total_amount,
        payment_amount,
        change_amount,
        payment_method,
        status,
        notes,
        cashier:profiles!cashier_id (
          id,
          full_name
        ),
        transaction_items (
          id,
          item_name,
          unit_name,
          price,
          quantity,
          subtotal,
          source_type,
          product_id,
          temporary_price_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mengambil ringkasan transaksi hari ini untuk dashboard
   */
  async getTodaySummary(cashierId = null) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    let query = supabase
      .from('transactions')
      .select('total_amount, total_quantity')
      .eq('status', 'completed')
      .gte('transaction_date', startOfDay)
      .lt('transaction_date', endOfDay);

    if (cashierId) {
      query = query.eq('cashier_id', cashierId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total_amount), 0);
    const totalItemsSold = transactions.reduce((sum, t) => sum + Number(t.total_quantity), 0);
    const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    return {
      transactionCount: transactions.length,
      totalRevenue,
      totalItemsSold,
      avgTransaction,
    };
  },
};

export default transactionService;
