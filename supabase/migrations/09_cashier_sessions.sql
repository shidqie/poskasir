-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 11: CASHIER SESSIONS, CASH BALANCE & QRIS BREAKDOWN
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Buat Tabel cashier_sessions
CREATE TABLE IF NOT EXISTS public.cashier_sessions (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id        UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    opened_at         TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    opening_cash      NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (opening_cash >= 0),
    status            TEXT          NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_at         TIMESTAMPTZ   NULL,
    cash_sales        NUMERIC(14,2) NOT NULL DEFAULT 0,
    qris_sales        NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_sales       NUMERIC(14,2) NOT NULL DEFAULT 0,
    expected_cash     NUMERIC(14,2) NOT NULL DEFAULT 0,
    actual_cash       NUMERIC(14,2) NULL,
    cash_difference   NUMERIC(14,2) NULL,
    transaction_count INTEGER       NOT NULL DEFAULT 0,
    cash_tx_count     INTEGER       NOT NULL DEFAULT 0,
    qris_tx_count     INTEGER       NOT NULL DEFAULT 0,
    notes             TEXT          NULL,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Tambah kolom cashier_session_id ke tabel transactions jika belum ada
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS cashier_session_id UUID NULL REFERENCES public.cashier_sessions(id) ON DELETE SET NULL;

-- 3. Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_sessions_cashier_status ON public.cashier_sessions(cashier_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_opened_at      ON public.cashier_sessions(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_session    ON public.transactions(cashier_session_id);

-- 4. Row Level Security (RLS)
ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sessions select policy" ON public.cashier_sessions;
CREATE POLICY "Sessions select policy" ON public.cashier_sessions
    FOR SELECT TO authenticated
    USING (cashier_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "Sessions insert policy" ON public.cashier_sessions;
CREATE POLICY "Sessions insert policy" ON public.cashier_sessions
    FOR INSERT TO authenticated
    WITH CHECK (cashier_id = auth.uid());

DROP POLICY IF EXISTS "Sessions update policy" ON public.cashier_sessions;
CREATE POLICY "Sessions update policy" ON public.cashier_sessions
    FOR UPDATE TO authenticated
    USING (cashier_id = auth.uid() OR public.is_owner())
    WITH CHECK (cashier_id = auth.uid() OR public.is_owner());

-- ==============================================================================
-- 5. RPC: open_cashier_session
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.open_cashier_session(
    p_opening_cash NUMERIC DEFAULT 0,
    p_notes        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id     UUID;
    v_active_id   UUID;
    v_session     public.cashier_sessions%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Pengguna tidak terautentikasi.';
    END IF;

    IF p_opening_cash < 0 THEN
        RAISE EXCEPTION 'Saldo awal tunai tidak boleh bernilai negatif.';
    END IF;

    -- Cek jika kasir masih memiliki sesi aktif yang belum ditutup
    SELECT id INTO v_active_id
    FROM public.cashier_sessions
    WHERE cashier_id = v_user_id AND status = 'open'
    LIMIT 1;

    IF v_active_id IS NOT NULL THEN
        RAISE EXCEPTION 'Kasir masih memiliki sesi aktif. Silakan tutup sesi sebelumnya terlebih dahulu.';
    END IF;

    -- Buat sesi kasir baru
    INSERT INTO public.cashier_sessions (
        cashier_id,
        opened_at,
        opening_cash,
        status,
        expected_cash,
        notes,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        timezone('utc'::text, now()),
        p_opening_cash,
        'open',
        p_opening_cash,
        TRIM(p_notes),
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING * INTO v_session;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Kasir berhasil dibuka. Saldo awal tunai: Rp' || TO_CHAR(p_opening_cash, 'FM999,999,999'),
        'session', to_jsonb(v_session)
    );
END;
$$;

-- ==============================================================================
-- 6. RPC: close_cashier_session (Database calculate sales & difference)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.close_cashier_session(
    p_session_id  UUID,
    p_actual_cash NUMERIC,
    p_notes       TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_session          public.cashier_sessions%ROWTYPE;
    v_cash_sales       NUMERIC(14,2) := 0;
    v_qris_sales       NUMERIC(14,2) := 0;
    v_total_sales      NUMERIC(14,2) := 0;
    v_expected_cash    NUMERIC(14,2) := 0;
    v_cash_difference  NUMERIC(14,2) := 0;
    v_tx_count         INTEGER := 0;
    v_cash_tx_count    INTEGER := 0;
    v_qris_tx_count    INTEGER := 0;
    v_updated_session  public.cashier_sessions%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Pengguna tidak terautentikasi.';
    END IF;

    IF p_actual_cash IS NULL OR p_actual_cash < 0 THEN
        RAISE EXCEPTION 'Uang tunai aktual di laci wajib diisi dan tidak boleh negatif.';
    END IF;

    -- Ambil dan kunci baris sesi
    SELECT * INTO v_session
    FROM public.cashier_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sesi kasir tidak ditemukan.';
    END IF;

    IF v_session.status = 'closed' THEN
        RAISE EXCEPTION 'Sesi kasir ini sudah ditutup sebelumnya.';
    END IF;

    IF v_session.cashier_id != auth.uid() AND NOT public.is_owner() THEN
        RAISE EXCEPTION 'Akses ditolak. Anda tidak berhak menutup sesi kasir ini.';
    END IF;

    -- Hitung total penjualan tunai & QRIS dari database transactions secara langsung
    SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COALESCE(COUNT(CASE WHEN payment_method = 'cash' THEN 1 END), 0),
        COALESCE(COUNT(CASE WHEN payment_method = 'qris' THEN 1 END), 0)
    INTO
        v_cash_sales,
        v_qris_sales,
        v_total_sales,
        v_tx_count,
        v_cash_tx_count,
        v_qris_tx_count
    FROM public.transactions
    WHERE (
        cashier_session_id = p_session_id
        OR (cashier_session_id IS NULL AND cashier_id = v_session.cashier_id AND transaction_date >= v_session.opened_at)
    )
    AND status = 'completed';

    -- Rumus Saldo Tunai Seharusnya = Saldo Awal Tunai + Penjualan Tunai (QRIS TIDAK masuk kas fisik laci!)
    v_expected_cash   := v_session.opening_cash + v_cash_sales;
    v_cash_difference := p_actual_cash - v_expected_cash;

    -- Update sesi kasir
    UPDATE public.cashier_sessions
    SET status            = 'closed',
        closed_at         = timezone('utc'::text, now()),
        cash_sales        = v_cash_sales,
        qris_sales        = v_qris_sales,
        total_sales       = v_total_sales,
        expected_cash     = v_expected_cash,
        actual_cash       = p_actual_cash,
        cash_difference   = v_cash_difference,
        transaction_count = v_tx_count,
        cash_tx_count     = v_cash_tx_count,
        qris_tx_count     = v_qris_tx_count,
        notes             = COALESCE(TRIM(p_notes), v_session.notes),
        updated_at        = timezone('utc'::text, now())
    WHERE id = p_session_id
    RETURNING * INTO v_updated_session;

    -- Link transaksi yang belum memiliki session_id
    UPDATE public.transactions
    SET cashier_session_id = p_session_id
    WHERE cashier_id = v_session.cashier_id
      AND transaction_date >= v_session.opened_at
      AND cashier_session_id IS NULL;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Sesi kasir berhasil ditutup.',
        'session', to_jsonb(v_updated_session),
        'difference_status', CASE
            WHEN v_cash_difference = 0 THEN 'Sesuai'
            WHEN v_cash_difference > 0 THEN 'Lebih'
            ELSE 'Kurang'
        END
    );
END;
$$;

-- ==============================================================================
-- 7. UPDATE RPC process_sale agar otomatis memasukkan cashier_session_id aktif
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.process_sale(
    p_items             JSONB,
    p_payment_amount    NUMERIC,
    p_payment_method    TEXT DEFAULT 'cash',
    p_idempotency_key   UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cashier_id        UUID;
    v_session_id        UUID;
    v_trx_id            UUID;
    v_trx_number        TEXT;
    v_idem_key          UUID;
    v_total_amount      NUMERIC(14,2) := 0;
    v_total_quantity    NUMERIC(14,3) := 0;
    v_change_amount     NUMERIC(14,2) := 0;
    v_existing_trx_id   UUID;
    v_item              JSONB;
    v_source_type       TEXT;
    v_item_qty          NUMERIC(14,3);
    v_item_price        NUMERIC(14,2);
    v_item_subtotal     NUMERIC(14,2);
    v_product_id        UUID;
    v_unreg_id          UUID;
    v_item_name         TEXT;
    v_item_unit         TEXT;
    v_product           RECORD;
    v_unreg             RECORD;
BEGIN
    -- 1. Auth Check
    v_cashier_id := auth.uid();
    IF v_cashier_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pengguna tidak terautentikasi.');
    END IF;

    -- 2. Cek Sesi Kasir Aktif
    SELECT id INTO v_session_id
    FROM public.cashier_sessions
    WHERE cashier_id = v_cashier_id AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;

    -- Jika tidak ada sesi aktif dan user bukan owner bypass, tolak transaksi
    IF v_session_id IS NULL AND NOT public.is_owner() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Kasir belum dibuka. Silakan buka kasir terlebih dahulu untuk mulai melakukan transaksi.'
        );
    END IF;

    -- 3. Idempotency Check
    v_idem_key := COALESCE(p_idempotency_key, gen_random_uuid());
    SELECT id INTO v_existing_trx_id
    FROM public.transactions
    WHERE idempotency_key = v_idem_key;

    IF v_existing_trx_id IS NOT NULL THEN
        RETURN (
            SELECT jsonb_build_object(
                'success', true,
                'idempotent', true,
                'transaction_id', t.id,
                'transaction_number', t.transaction_number,
                'total_quantity', t.total_quantity,
                'total_amount', t.total_amount,
                'payment_amount', t.payment_amount,
                'change_amount', t.change_amount
            )
            FROM public.transactions t
            WHERE t.id = v_existing_trx_id
        );
    END IF;

    -- 4. Validasi items
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Keranjang belanja kosong.');
    END IF;

    -- 5. Loop hitung & kurangi stok
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;

        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Kuantitas barang tidak valid.');
        END IF;

        IF v_source_type = 'product' THEN
            v_product_id := (v_item->>'productId')::UUID;

            SELECT name, selling_price, stock, unit_id INTO v_product
            FROM public.products
            WHERE id = v_product_id;

            IF NOT FOUND THEN
                RETURN jsonb_build_object('success', false, 'error', 'Produk tidak ditemukan: ' || COALESCE(v_item->>'name','?'));
            END IF;

            v_item_price := v_product.selling_price;
            v_item_name  := v_product.name;
            SELECT symbol INTO v_item_unit FROM public.units WHERE id = v_product.unit_id;
            v_unreg_id   := NULL;

            -- Kurangi stok
            UPDATE public.products
            SET stock = stock - v_item_qty,
                updated_at = timezone('utc'::text, now())
            WHERE id = v_product_id;

        ELSIF v_source_type = 'temporary' THEN
            v_unreg_id := (v_item->>'temporaryPriceId')::UUID;
            v_item_price := (v_item->>'price')::NUMERIC;
            v_item_name  := v_item->>'name';
            v_item_unit  := v_item->>'unit_name';
            v_product_id := NULL;
        ELSE
            v_item_price := (v_item->>'price')::NUMERIC;
            v_item_name  := v_item->>'name';
            v_item_unit  := 'Item';
            v_product_id := NULL;
            v_unreg_id   := NULL;
        END IF;

        v_item_subtotal  := ROUND(v_item_price * v_item_qty, 2);
        v_total_quantity := v_total_quantity + v_item_qty;
        v_total_amount   := v_total_amount + v_item_subtotal;
    END LOOP;

    -- 6. Validasi Pembayaran
    IF p_payment_method = 'cash' THEN
        IF p_payment_amount < v_total_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Uang yang diterima kurang dari total belanja.'
            );
        END IF;
        v_change_amount := p_payment_amount - v_total_amount;
    ELSE
        -- QRIS / Transfer: nominal pas
        p_payment_amount := v_total_amount;
        v_change_amount  := 0;
    END IF;

    -- 7. Simpan Transaksi dengan cashier_session_id
    v_trx_number := public.generate_transaction_number();

    INSERT INTO public.transactions (
        transaction_number,
        cashier_id,
        cashier_session_id,
        transaction_date,
        total_quantity,
        subtotal,
        total_amount,
        payment_amount,
        change_amount,
        payment_method,
        status,
        idempotency_key,
        created_at
    ) VALUES (
        v_trx_number,
        v_cashier_id,
        v_session_id,
        now() AT TIME ZONE 'Asia/Jakarta',
        v_total_quantity,
        v_total_amount,
        v_total_amount,
        p_payment_amount,
        v_change_amount,
        p_payment_method,
        'completed',
        v_idem_key,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_trx_id;

    -- 8. Simpan Transaction Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;
        v_item_price  := (v_item->>'price')::NUMERIC;
        v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);

        INSERT INTO public.transaction_items (
            transaction_id,
            product_id,
            temporary_price_id,
            item_name,
            unit_name,
            price,
            quantity,
            subtotal
        ) VALUES (
            v_trx_id,
            (v_item->>'productId')::UUID,
            (v_item->>'temporaryPriceId')::UUID,
            v_item->>'name',
            COALESCE(v_item->>'unit_name', 'Item'),
            v_item_price,
            v_item_qty,
            v_item_subtotal
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_trx_id,
        'transaction_number', v_trx_number,
        'total_quantity', v_total_quantity,
        'total_amount', v_total_amount,
        'payment_amount', p_payment_amount,
        'change_amount', v_change_amount,
        'payment_method', p_payment_method,
        'cashier_session_id', v_session_id
    );
END;
$$;

-- 7. Grant Permissions
GRANT EXECUTE ON FUNCTION public.open_cashier_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session TO authenticated;

-- 8. Reload schema cache
NOTIFY pgrst, 'reload schema';
