import { supabase } from '@/lib/supabase';

export const transactionService = {
  /**
   * Memanggil process_sale() RPC di Supabase
   * Semua validasi harga & stok dilakukan di sisi database
   */
  async processSale({ items, paymentAmount, paymentMethod = 'cash', idempotencyKey }) {
    const payload = items.map((item) => ({
      sourceType: item.sourceType || 'product',
      productId: item.productId || null,
      variantId: item.variantId || null,
      temporaryPriceId: item.temporaryPriceId || null,
      name: item.productName || item.name,
      variantName: item.variantName || null,
      displayName: item.displayName || (item.variantName ? `${item.name} - ${item.variantName}` : item.name),
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
          variant_name,
          variant_id,
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

    // Normalisasi items agar kompatibel dengan view detail & struk
    if (data && data.transaction_items) {
      data.items = data.transaction_items.map((item) => ({
        ...item,
        product_name: item.variant_name
          ? `${item.item_name} - ${item.variant_name}`
          : item.item_name,
        raw_product_name: item.item_name,
        variant_name: item.variant_name,
        unit_price: item.price,
        unit_symbol: item.unit_name,
      }));
    }

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
      .select('total_amount, total_quantity, payment_method')
      .eq('status', 'completed')
      .gte('transaction_date', startOfDay)
      .lt('transaction_date', endOfDay);

    if (cashierId) {
      query = query.eq('cashier_id', cashierId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const transactions = data || [];
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const totalItemsSold = transactions.reduce((sum, t) => sum + Number(t.total_quantity || 0), 0);
    const avgTransaction = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    const cashTxs = transactions.filter((t) => t.payment_method === 'cash');
    const qrisTxs = transactions.filter((t) => t.payment_method === 'qris' || t.payment_method === 'transfer');

    const cashRevenue = cashTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
    const qrisRevenue = qrisTxs.reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

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
   * Memproses transaksi langsung dari Kalkulator Cepat & mencatat ke database/laporan
   */
  async processQuickCalculatorSale({ entries, paymentAmount, paymentMethod = 'cash' }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Anda harus login sebagai kasir/pemilik untuk mencatat transaksi.');
    }

    const totalAmount = entries.reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalQuantity = entries.length;
    const paid = Number(paymentAmount);
    const change = Math.max(0, paid - totalAmount);
    const idempotencyKey = crypto.randomUUID();

    // Generate transaction number
    let transactionNumber = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
      Math.floor(1000 + Math.random() * 9000)
    )}`;

    try {
      const { data: numData } = await supabase.rpc('generate_transaction_number');
      if (numData) transactionNumber = numData;
    } catch (e) {
      console.warn('[transactionService] Use fallback trx number:', e);
    }

    // Insert ke transactions
    const { data: trx, error: trxError } = await supabase
      .from('transactions')
      .insert({
        transaction_number: transactionNumber,
        cashier_id: user.id,
        total_quantity: totalQuantity,
        subtotal: totalAmount,
        total_amount: totalAmount,
        payment_amount: paid,
        change_amount: change,
        payment_method: paymentMethod,
        status: 'completed',
        idempotency_key: idempotencyKey,
        notes: 'Transaksi Kalkulator Cepat',
      })
      .select()
      .single();

    if (trxError) {
      console.error('[transactionService] Quick sale transaction error:', trxError);
      throw new Error(trxError.message || 'Gagal menyimpan transaksi ke laporan.');
    }

    // Insert items
    const itemsPayload = entries.map((e, idx) => ({
      transaction_id: trx.id,
      item_name: e.label || `Item ${idx + 1}`,
      unit_name: 'Pcs',
      price: Number(e.amount),
      quantity: 1,
      subtotal: Number(e.amount),
      source_type: 'temporary',
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(itemsPayload);

    if (itemsError) {
      console.warn('[transactionService] Quick sale items warning:', itemsError);
    }

    return {
      success: true,
      transaction_id: trx.id,
      transaction_number: trx.transaction_number,
      total_amount: totalAmount,
      payment_amount: paid,
      change_amount: change,
      total_quantity: totalQuantity,
    };
  },
};

export default transactionService;
