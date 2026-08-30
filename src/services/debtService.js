import { supabase } from '@/lib/supabase';

export const debtService = {
  /**
   * Mengambil daftar pelanggan beserta ringkasan saldo hutang, pembayaran terakhir, dan status
   */
  async getCustomersWithDebt({
    status = 'all', // 'all' | 'unpaid' | 'partial' | 'paid'
    search = '',
    sortBy = 'debt_desc', // 'debt_desc' | 'debt_asc' | 'newest' | 'oldest' | 'name_asc'
  } = {}) {
    // 1. Ambil data pelanggan
    let custQuery = supabase
      .from('customers')
      .select('*')
      .eq('status', true);

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      custQuery = custQuery.or(`name.ilike.${q},phone.ilike.${q}`);
    }

    const { data: customers, error: custErr } = await custQuery;
    if (custErr) throw custErr;
    if (!customers || customers.length === 0) return [];

    const customerIds = customers.map((c) => c.id);

    // 2. Ambil seluruh record hutang pelanggan
    const { data: debts, error: debtsErr } = await supabase
      .from('customer_debts')
      .select('*')
      .in('customer_id', customerIds)
      .order('created_at', { ascending: false });

    if (debtsErr) throw debtsErr;

    // 3. Ambil pembayaran terakhir masing-masing pelanggan
    const { data: payments, error: payErr } = await supabase
      .from('debt_payments')
      .select('customer_id, amount, payment_method, payment_date')
      .in('customer_id', customerIds)
      .order('payment_date', { ascending: false });

    if (payErr) throw payErr;

    // 4. Agregasi per pelanggan
    const result = customers.map((c) => {
      const custDebts = (debts || []).filter((d) => d.customer_id === c.id);
      const custPayments = (payments || []).filter((p) => p.customer_id === c.id);

      const totalOriginalDebt = custDebts.reduce((sum, d) => sum + Number(d.original_amount || 0), 0);
      const totalPaid = custDebts.reduce((sum, d) => sum + Number(d.paid_amount || 0), 0);
      const remainingDebt = custDebts.reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);

      const activeDebtsCount = custDebts.filter((d) => Number(d.remaining_amount) > 0).length;
      const lastDebt = custDebts.length > 0 ? custDebts[0] : null;
      const lastPayment = custPayments.length > 0 ? custPayments[0] : null;

      let computedStatus = 'unpaid';
      if (remainingDebt <= 0 && totalOriginalDebt > 0) {
        computedStatus = 'paid';
      } else if (totalPaid > 0 && remainingDebt > 0) {
        computedStatus = 'partial';
      } else if (remainingDebt > 0 && totalPaid === 0) {
        computedStatus = 'unpaid';
      } else {
        computedStatus = 'paid'; // Tidak pernah hutang / 0
      }

      return {
        ...c,
        totalOriginalDebt,
        totalPaid,
        remainingDebt,
        activeDebtsCount,
        totalTransactions: custDebts.length,
        lastDebtDate: lastDebt?.created_at || null,
        lastPaymentAmount: lastPayment?.amount || null,
        lastPaymentDate: lastPayment?.payment_date || null,
        lastPaymentMethod: lastPayment?.payment_method || null,
        debtStatus: computedStatus,
      };
    });

    // 5. Filter status
    let filtered = result;
    if (status && status !== 'all') {
      if (status === 'unpaid') {
        filtered = result.filter((c) => c.debtStatus === 'unpaid' && c.remainingDebt > 0);
      } else if (status === 'partial') {
        filtered = result.filter((c) => c.debtStatus === 'partial');
      } else if (status === 'paid') {
        filtered = result.filter((c) => c.debtStatus === 'paid');
      }
    }

    // 6. Urutkan (Sorting)
    filtered.sort((a, b) => {
      if (sortBy === 'debt_desc') return b.remainingDebt - a.remainingDebt;
      if (sortBy === 'debt_asc') return a.remainingDebt - b.remainingDebt;
      if (sortBy === 'newest') {
        const dateA = new Date(a.lastDebtDate || a.created_at).getTime();
        const dateB = new Date(b.lastDebtDate || b.created_at).getTime();
        return dateB - dateA;
      }
      if (sortBy === 'oldest') {
        const dateA = new Date(a.lastDebtDate || a.created_at).getTime();
        const dateB = new Date(b.lastDebtDate || b.created_at).getTime();
        return dateA - dateB;
      }
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return filtered;
  },

  /**
   * Mengambil ringkasan saldo hutang pelanggan tertentu
   */
  async getCustomerDebtSummary(customerId) {
    if (!customerId) return null;

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (custErr) throw custErr;

    const { data: debts, error: debtsErr } = await supabase
      .from('customer_debts')
      .select('*')
      .eq('customer_id', customerId);

    if (debtsErr) throw debtsErr;

    const totalOriginalDebt = (debts || []).reduce((sum, d) => sum + Number(d.original_amount || 0), 0);
    const totalPaid = (debts || []).reduce((sum, d) => sum + Number(d.paid_amount || 0), 0);
    const remainingDebt = (debts || []).reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);

    let status = 'unpaid';
    if (remainingDebt <= 0 && totalOriginalDebt > 0) {
      status = 'paid';
    } else if (totalPaid > 0 && remainingDebt > 0) {
      status = 'partial';
    }

    return {
      customer,
      totalOriginalDebt,
      totalPaid,
      remainingDebt,
      status,
      unpaidCount: (debts || []).filter((d) => Number(d.remaining_amount) > 0).length,
    };
  },

  /**
   * Mengambil daftar transaksi hutang belanja pelanggan beserta rincian barang
   */
  async getCustomerDebtTransactions(customerId) {
    if (!customerId) return [];

    const { data: debts, error } = await supabase
      .from('customer_debts')
      .select(`
        *,
        transaction:transactions(
          id,
          transaction_number,
          transaction_date,
          total_amount,
          total_quantity,
          status,
          cashier:profiles!cashier_id(id, full_name),
          transaction_items(
            id,
            item_name,
            variant_name,
            unit_name,
            price,
            quantity,
            subtotal
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return debts || [];
  },

  /**
   * Mengambil riwayat setoran pembayaran hutang pelanggan
   */
  async getCustomerPaymentHistory(customerId) {
    if (!customerId) return [];

    const { data: payments, error } = await supabase
      .from('debt_payments')
      .select(`
        *,
        receiver:profiles!received_by(id, full_name)
      `)
      .eq('customer_id', customerId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return payments || [];
  },

  /**
   * Membayar / Melunasi hutang pelanggan melalui RPC pay_customer_debt (FIFO)
   */
  async payCustomerDebt({
    customer_id,
    amount,
    payment_method = 'cash',
    cashier_session_id = null,
    notes = null,
  }) {
    if (!customer_id) throw new Error('Pelanggan wajib dipilih.');
    if (!amount || Number(amount) <= 0) {
      throw new Error('Nominal pembayaran harus lebih dari Rp 0.');
    }

    const { data, error } = await supabase.rpc('pay_customer_debt', {
      p_customer_id: customer_id,
      p_amount: Number(amount),
      p_payment_method: payment_method,
      p_cashier_session_id: cashier_session_id,
      p_notes: notes ? notes.trim() : null,
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error || 'Gagal memproses pembayaran hutang.');

    return data;
  },

  /**
   * Mengambil statistik global piutang toko untuk Dashboard & Laporan
   */
  async getDebtGlobalSummary() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    // 1. Total Sisa Piutang Aktif
    const { data: debts, error: debtsErr } = await supabase
      .from('customer_debts')
      .select('customer_id, remaining_amount, original_amount, created_at')
      .in('status', ['unpaid', 'partial']);

    if (debtsErr) throw debtsErr;

    const totalOutstandingDebt = (debts || []).reduce((sum, d) => sum + Number(d.remaining_amount || 0), 0);
    const uniqueCustomersWithDebt = new Set((debts || []).filter((d) => Number(d.remaining_amount) > 0).map((d) => d.customer_id)).size;

    // Hutang baru hari ini
    const todayDebts = (debts || []).filter((d) => d.created_at >= startOfDay && d.created_at < endOfDay);
    const todayNewDebt = todayDebts.reduce((sum, d) => sum + Number(d.original_amount || 0), 0);

    // 2. Pembayaran Hutang Hari Ini
    const { data: todayPayments, error: payErr } = await supabase
      .from('debt_payments')
      .select('amount, payment_method')
      .gte('payment_date', startOfDay)
      .lt('payment_date', endOfDay);

    if (payErr) throw payErr;

    const todayDebtPayments = (todayPayments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const todayCashDebtPayments = (todayPayments || [])
      .filter((p) => p.payment_method === 'cash')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const todayQrisDebtPayments = (todayPayments || [])
      .filter((p) => p.payment_method === 'qris' || p.payment_method === 'transfer')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      totalOutstandingDebt,
      totalCustomersWithDebt: uniqueCustomersWithDebt,
      todayNewDebt,
      todayDebtPayments,
      todayCashDebtPayments,
      todayQrisDebtPayments,
    };
  },
};

export default debtService;
