-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 13: FITUR AMBIL UANG / KAS KELUAR & KAS MASUK (CASH MOVEMENTS)
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Buat Tabel cash_movements
CREATE TABLE IF NOT EXISTS public.cash_movements (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_session_id  UUID          NOT NULL REFERENCES public.cashier_sessions(id) ON DELETE CASCADE,
    movement_type       TEXT          NOT NULL CHECK (movement_type IN ('cash_in', 'cash_out')),
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    category            TEXT          NOT NULL,
    person_name         TEXT          NOT NULL,
    notes               TEXT          NULL,
    recorded_by         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk performa audit & riwayat
CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements (cashier_session_id);
CREATE INDEX IF NOT EXISTS idx_cash_movements_type    ON public.cash_movements (movement_type);
CREATE INDEX IF NOT EXISTS idx_cash_movements_created ON public.cash_movements (created_at DESC);

-- 2. Row Level Security (RLS)
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cash movements select policy" ON public.cash_movements;
CREATE POLICY "Cash movements select policy" ON public.cash_movements
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Cash movements insert policy" ON public.cash_movements;
CREATE POLICY "Cash movements insert policy" ON public.cash_movements
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Cash movements update policy by owner" ON public.cash_movements;
CREATE POLICY "Cash movements update policy by owner" ON public.cash_movements
    FOR UPDATE TO authenticated USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "Cash movements delete policy by owner" ON public.cash_movements;
CREATE POLICY "Cash movements delete policy by owner" ON public.cash_movements
    FOR DELETE TO authenticated USING (public.is_owner());

-- ==============================================================================
-- 3. RPC: record_cash_movement (PENCATATAN AMBIL UANG / KAS KELUAR & KAS MASUK)
-- ==============================================================================

-- Bersihkan versi overloaded fungsi sebelumnya agar tidak bentrok
DO $CLEANUP$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_sig
        FROM pg_proc
        WHERE proname IN ('record_cash_movement', 'close_cashier_session')
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE;';
    END LOOP;
END $CLEANUP$;

CREATE OR REPLACE FUNCTION public.record_cash_movement(
    p_cashier_session_id UUID,
    p_movement_type      TEXT,
    p_amount             NUMERIC,
    p_category           TEXT,
    p_person_name        TEXT,
    p_notes              TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id             UUID;
    v_session             public.cashier_sessions%ROWTYPE;
    v_cash_sales          NUMERIC(14,2) := 0;
    v_cash_debt_payments  NUMERIC(14,2) := 0;
    v_total_cash_in       NUMERIC(14,2) := 0;
    v_total_cash_out      NUMERIC(14,2) := 0;
    v_available_cash      NUMERIC(14,2) := 0;
    v_movement_id         UUID;
BEGIN
    -- 1. Validasi Autentikasi Pengguna
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pengguna tidak terautentikasi.');
    END IF;

    -- 2. Validasi Parameter
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nominal uang harus lebih dari Rp 0.');
    END IF;

    IF p_movement_type NOT IN ('cash_in', 'cash_out') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Jenis pergerakan kas tidak valid (gunakan cash_in atau cash_out).');
    END IF;

    IF p_person_name IS NULL OR trim(p_person_name) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nama orang yang mengambil/menyetor uang wajib diisi.');
    END IF;

    IF p_category IS NULL OR trim(p_category) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kategori keperluan wajib diisi.');
    END IF;

    -- 3. Cek Status Sesi Kasir Aktif
    SELECT * INTO v_session
    FROM public.cashier_sessions
    WHERE id = p_cashier_session_id
    FOR UPDATE;

    IF v_session.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesi kasir tidak ditemukan.');
    END IF;

    IF v_session.status != 'open' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Sesi kasir ini sudah ditutup. Tidak dapat mencatat kas keluar/masuk.');
    END IF;

    -- 4. Hitung Saldo Tunai Fisik yang Tersedia di Laci Saat Ini
    -- Saldo Tersedia = Saldo Awal + Penjualan Tunai + Pembayaran Hutang Tunai + Total Kas Masuk - Total Kas Keluar
    SELECT COALESCE(SUM(total_amount), 0) INTO v_cash_sales
    FROM public.transactions
    WHERE cashier_session_id = p_cashier_session_id AND payment_method = 'cash' AND status = 'completed';

    SELECT COALESCE(SUM(amount), 0) INTO v_cash_debt_payments
    FROM public.debt_payments
    WHERE cashier_session_id = p_cashier_session_id AND payment_method = 'cash';

    SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'cash_in' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN movement_type = 'cash_out' THEN amount ELSE 0 END), 0)
    INTO 
        v_total_cash_in,
        v_total_cash_out
    FROM public.cash_movements
    WHERE cashier_session_id = p_cashier_session_id;

    v_available_cash := v_session.opening_cash + v_cash_sales + v_cash_debt_payments + v_total_cash_in - v_total_cash_out;

    -- 5. Validasi: Tolak Pengambilan Uang Melebihi Saldo Fisik yang Tersedia
    IF p_movement_type = 'cash_out' AND p_amount > v_available_cash THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nominal pengambilan (Rp ' || to_char(p_amount, 'FM999,999,999') || ') melebihi saldo tunai fisik yang tersedia di laci (Rp ' || to_char(v_available_cash, 'FM999,999,999') || ').'
        );
    END IF;

    -- 6. Simpan Catatan Kas ke Tabel cash_movements
    INSERT INTO public.cash_movements (
        cashier_session_id,
        movement_type,
        amount,
        category,
        person_name,
        notes,
        recorded_by,
        created_at
    ) VALUES (
        p_cashier_session_id,
        p_movement_type,
        p_amount,
        trim(p_category),
        trim(p_person_name),
        trim(p_notes),
        v_user_id,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_movement_id;

    -- Hitung Saldo Tunai Seharusnya Baru Setelah Transaksi Ini
    IF p_movement_type = 'cash_out' THEN
        v_available_cash := v_available_cash - p_amount;
    ELSE
        v_available_cash := v_available_cash + p_amount;
    END IF;

    RETURN jsonb_build_object(
        'success',              true,
        'movement_id',          v_movement_id,
        'cashier_session_id',   p_cashier_session_id,
        'movement_type',        p_movement_type,
        'amount',               p_amount,
        'category',             p_category,
        'person_name',          p_person_name,
        'notes',                p_notes,
        'new_expected_cash',    v_available_cash
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Gagal mencatat kas keluar/masuk: ' || SQLERRM
    );
END;
$$;

-- ==============================================================================
-- 4. RPC: close_cashier_session (UPDATE REKONSILIASI KAS KELUAR & KAS MASUK)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.close_cashier_session(
    p_session_id   UUID,
    p_actual_cash  NUMERIC,
    p_notes        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id              UUID;
    v_session              public.cashier_sessions%ROWTYPE;
    v_cash_sales           NUMERIC(14,2) := 0;
    v_qris_sales           NUMERIC(14,2) := 0;
    v_debt_sales           NUMERIC(14,2) := 0;
    v_total_sales          NUMERIC(14,2) := 0;
    v_cash_debt_payments   NUMERIC(14,2) := 0;
    v_qris_debt_payments   NUMERIC(14,2) := 0;
    v_total_debt_payments  NUMERIC(14,2) := 0;
    v_cash_in              NUMERIC(14,2) := 0;
    v_cash_out             NUMERIC(14,2) := 0;
    v_expected_cash        NUMERIC(14,2) := 0;
    v_cash_diff            NUMERIC(14,2) := 0;
    v_tx_count             INTEGER := 0;
    v_cash_tx_count        INTEGER := 0;
    v_qris_tx_count        INTEGER := 0;
    v_debt_tx_count        INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna tidak terautentikasi.';
    END IF;

    -- Ambil data sesi
    SELECT * INTO v_session
    FROM public.cashier_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF v_session.id IS NULL THEN
        RAISE EXCEPTION 'Sesi kasir tidak ditemukan.';
    END IF;

    IF v_session.status = 'closed' THEN
        RAISE EXCEPTION 'Sesi kasir ini sudah ditutup sebelumnya.';
    END IF;

    IF v_session.cashier_id != v_user_id AND NOT public.is_owner() THEN
        RAISE EXCEPTION 'Anda tidak memiliki hak akses untuk menutup sesi kasir ini.';
    END IF;

    -- 1. Hitung Penjualan POS Berdasarkan Metode
    SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method IN ('qris', 'transfer') THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'debt' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END),
        COUNT(CASE WHEN payment_method IN ('qris', 'transfer') THEN 1 END),
        COUNT(CASE WHEN payment_method = 'debt' THEN 1 END)
    INTO 
        v_cash_sales,
        v_qris_sales,
        v_debt_sales,
        v_total_sales,
        v_tx_count,
        v_cash_tx_count,
        v_qris_tx_count,
        v_debt_tx_count
    FROM public.transactions
    WHERE cashier_session_id = p_session_id AND status = 'completed';

    -- 2. Hitung Penerimaan Pembayaran Hutang pada Sesi Ini
    SELECT 
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method IN ('qris', 'transfer') THEN amount ELSE 0 END), 0),
        COALESCE(SUM(amount), 0)
    INTO 
        v_cash_debt_payments,
        v_qris_debt_payments,
        v_total_debt_payments
    FROM public.debt_payments
    WHERE cashier_session_id = p_session_id;

    -- 3. Hitung Kas Masuk & Kas Keluar pada Sesi Ini
    SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'cash_in' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN movement_type = 'cash_out' THEN amount ELSE 0 END), 0)
    INTO 
        v_cash_in,
        v_cash_out
    FROM public.cash_movements
    WHERE cashier_session_id = p_session_id;

    -- 4. Hitung Saldo Kas Fisik Seharusnya:
    -- expected_cash = opening_cash + cash_sales + cash_debt_payments + cash_in - cash_out
    v_expected_cash := v_session.opening_cash + v_cash_sales + v_cash_debt_payments + v_cash_in - v_cash_out;

    -- 5. Hitung Selisih Kas Fisik
    v_cash_diff := p_actual_cash - v_expected_cash;

    -- 6. Update Record Sesi Kasir Menjadi Ditutup
    UPDATE public.cashier_sessions
    SET 
        status             = 'closed',
        closed_at          = timezone('utc'::text, now()),
        cash_sales         = v_cash_sales,
        qris_sales         = v_qris_sales,
        total_sales        = v_total_sales,
        expected_cash      = v_expected_cash,
        actual_cash        = p_actual_cash,
        cash_difference    = v_cash_diff,
        transaction_count  = v_tx_count,
        cash_tx_count      = v_cash_tx_count,
        qris_tx_count      = v_qris_tx_count,
        notes              = COALESCE(p_notes, v_session.notes),
        updated_at         = timezone('utc'::text, now())
    WHERE id = p_session_id
    RETURNING * INTO v_session;

    RETURN jsonb_build_object(
        'success',               true,
        'session',               to_jsonb(v_session),
        'cash_sales',            v_cash_sales,
        'qris_sales',            v_qris_sales,
        'debt_sales',            v_debt_sales,
        'total_sales',           v_total_sales,
        'cash_debt_payments',    v_cash_debt_payments,
        'qris_debt_payments',    v_qris_debt_payments,
        'total_debt_payments',   v_total_debt_payments,
        'cash_in',               v_cash_in,
        'cash_out',              v_cash_out,
        'expected_cash',         v_expected_cash,
        'actual_cash',           p_actual_cash,
        'cash_difference',       v_cash_diff
    );
END;
$$;

-- Izin Eksekusi RPC
GRANT EXECUTE ON FUNCTION public.record_cash_movement(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(UUID, NUMERIC, TEXT) TO authenticated;

-- RELOAD SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';
