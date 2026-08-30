-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 12: FITUR HUTANG PELANGGAN (CUSTOMER DEBTS & CREDIT)
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Buat Tabel customers
CREATE TABLE IF NOT EXISTS public.customers (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT          NOT NULL,
    phone       TEXT          NULL,
    address     TEXT          NULL,
    notes       TEXT          NULL,
    status      BOOLEAN       DEFAULT TRUE,
    created_by  UUID          NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index customers
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers (name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);

-- 2. Tambah kolom customer_id ke tabel transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS customer_id UUID NULL REFERENCES public.customers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions (customer_id);

-- Update check constraint payment_method jika ada
DO $$
BEGIN
    ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_payment_method_check 
        CHECK (payment_method IN ('cash', 'qris', 'transfer', 'debt'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. Buat Tabel customer_debts
CREATE TABLE IF NOT EXISTS public.customer_debts (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id       UUID          NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    transaction_id    UUID          NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    original_amount   NUMERIC(14,2) NOT NULL CHECK (original_amount >= 0),
    paid_amount       NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount  NUMERIC(14,2) NOT NULL CHECK (remaining_amount >= 0),
    status            TEXT          NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_customer_debts_customer ON public.customer_debts (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_debts_status   ON public.customer_debts (status);
CREATE INDEX IF NOT EXISTS idx_customer_debts_created  ON public.customer_debts (created_at ASC);

-- 4. Buat Tabel debt_payments
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id         UUID          NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    debt_id             UUID          NULL REFERENCES public.customer_debts(id) ON DELETE SET NULL,
    amount              NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    payment_method      TEXT          NOT NULL CHECK (payment_method IN ('cash', 'qris', 'transfer')),
    cashier_session_id  UUID          NULL REFERENCES public.cashier_sessions(id) ON DELETE SET NULL,
    received_by         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    payment_date        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    notes               TEXT          NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_customer ON public.debt_payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_session  ON public.debt_payments (cashier_session_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date     ON public.debt_payments (payment_date DESC);

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- RLS customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers select policy" ON public.customers;
CREATE POLICY "Customers select policy" ON public.customers
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Customers insert policy" ON public.customers;
CREATE POLICY "Customers insert policy" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Customers update policy" ON public.customers;
CREATE POLICY "Customers update policy" ON public.customers
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS customer_debts
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Debts select policy" ON public.customer_debts;
CREATE POLICY "Debts select policy" ON public.customer_debts
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Debts insert policy" ON public.customer_debts;
CREATE POLICY "Debts insert policy" ON public.customer_debts
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Debts update policy" ON public.customer_debts;
CREATE POLICY "Debts update policy" ON public.customer_debts
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- RLS debt_payments
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payments select policy" ON public.debt_payments;
CREATE POLICY "Payments select policy" ON public.debt_payments
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Payments insert policy" ON public.debt_payments;
CREATE POLICY "Payments insert policy" ON public.debt_payments
    FOR INSERT TO authenticated WITH CHECK (true);

-- ==============================================================================
-- 6. RPC: process_sale (DIPERBARUI DENGAN DUKUNGAN METODE PEMBAYARAN HUTANG)
-- ==============================================================================

-- Bersihkan semua versi overloaded fungsi sebelumnya agar tidak bentrok
DO $CLEANUP$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_sig
        FROM pg_proc
        WHERE proname IN ('process_sale', 'close_cashier_session', 'pay_customer_debt')
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE;';
    END LOOP;
END $CLEANUP$;

CREATE OR REPLACE FUNCTION public.process_sale(
    p_cashier_id     UUID,
    p_payment_method TEXT,
    p_payment_amount NUMERIC,
    p_items          JSONB,
    p_customer_id    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id             UUID;
    v_session_id          UUID;
    v_session_status      TEXT;
    v_transaction_id      UUID;
    v_transaction_number  TEXT;
    v_total_amount        NUMERIC(14,2) := 0;
    v_total_quantity      NUMERIC(14,3) := 0;
    v_change_amount       NUMERIC(14,2) := 0;
    v_item                JSONB;
    v_item_id             UUID;
    v_item_name           TEXT;
    v_variant_id          UUID;
    v_variant_name        TEXT;
    v_unit_name           TEXT;
    v_price               NUMERIC(14,2);
    v_quantity            NUMERIC(14,3);
    v_subtotal            NUMERIC(14,2);
    v_source_type         TEXT;
    v_current_stock       NUMERIC(14,3);
    v_current_stock_int   INTEGER;
    v_new_stock           NUMERIC(14,3);
    v_allow_decimal       BOOLEAN;
    v_min_stock           INTEGER;
    v_today_str           TEXT;
    v_daily_seq           INTEGER;
    v_customer_exists     BOOLEAN;
BEGIN
    -- 1. Validasi Autentikasi Pengguna
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pengguna tidak terautentikasi.');
    END IF;

    -- 2. Validasi Sesi Kasir Aktif
    SELECT id, status INTO v_session_id, v_session_status
    FROM public.cashier_sessions
    WHERE cashier_id = v_user_id AND status = 'open'
    ORDER BY opened_at DESC
    LIMIT 1;

    IF v_session_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Kasir belum dibuka. Silakan buka kasir terlebih dahulu untuk mulai bertransaksi.'
        );
    END IF;

    -- 3. Validasi Metode Pembayaran
    IF p_payment_method NOT IN ('cash', 'qris', 'transfer', 'debt') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Metode pembayaran tidak valid. Gunakan cash, qris, transfer, atau debt.'
        );
    END IF;

    -- 4. Validasi Transaksi Hutang: Wajib Memilih Pelanggan
    IF p_payment_method = 'debt' THEN
        IF p_customer_id IS NULL THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Pelanggan wajib dipilih untuk transaksi dengan metode Hutang.'
            );
        END IF;

        SELECT EXISTS(SELECT 1 FROM public.customers WHERE id = p_customer_id) INTO v_customer_exists;
        IF NOT v_customer_exists THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Data pelanggan yang dipilih tidak ditemukan dalam sistem.'
            );
        END IF;
    END IF;

    -- 5. Validasi Daftar Item Belanja
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Keranjang belanja tidak boleh kosong.');
    END IF;

    -- 6. Hitung Total Tagihan & Validasi Kuantitas
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_price    := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'selling_price')::NUMERIC, 0);
        v_quantity := COALESCE((v_item->>'quantity')::NUMERIC, 0);

        IF v_quantity <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Kuantitas barang harus lebih dari 0.');
        END IF;
        IF v_price < 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Harga barang tidak boleh negatif.');
        END IF;

        v_subtotal       := ROUND(v_price * v_quantity, 2);
        v_total_amount   := v_total_amount + v_subtotal;
        v_total_quantity := v_total_quantity + v_quantity;
    END LOOP;

    -- 7. Validasi Nominal Pembayaran Tunai
    IF p_payment_method = 'cash' THEN
        IF p_payment_amount < v_total_amount THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Uang pembayaran tunai (' || p_payment_amount || ') kurang dari total tagihan (' || v_total_amount || ').'
            );
        END IF;
        v_change_amount := p_payment_amount - v_total_amount;
    ELSIF p_payment_method IN ('qris', 'transfer') THEN
        p_payment_amount := v_total_amount;
        v_change_amount := 0;
    ELSIF p_payment_method = 'debt' THEN
        p_payment_amount := 0; -- Belum ada uang masuk
        v_change_amount := 0;
    END IF;

    -- 8. Generate Nomor Transaksi Unik Harian: TRX-YYYYMMDD-XXXX
    v_today_str := to_char(timezone('Asia/Jakarta', now()), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO v_daily_seq
    FROM public.transactions
    WHERE to_char(timezone('Asia/Jakarta', transaction_date), 'YYYYMMDD') = v_today_str;

    v_transaction_number := 'TRX-' || v_today_str || '-' || LPAD(v_daily_seq::TEXT, 4, '0');

    -- 9. Simpan Header Transaksi
    INSERT INTO public.transactions (
        transaction_number,
        cashier_id,
        cashier_session_id,
        customer_id,
        total_amount,
        payment_amount,
        change_amount,
        payment_method,
        status,
        total_quantity,
        transaction_date,
        created_at
    ) VALUES (
        v_transaction_number,
        v_user_id,
        v_session_id,
        p_customer_id,
        v_total_amount,
        p_payment_amount,
        v_change_amount,
        p_payment_method,
        'completed',
        v_total_quantity,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_transaction_id;

    -- 10. Jika Metode Hutang -> Catat ke customer_debts
    IF p_payment_method = 'debt' THEN
        INSERT INTO public.customer_debts (
            customer_id,
            transaction_id,
            original_amount,
            paid_amount,
            remaining_amount,
            status,
            created_at,
            updated_at
        ) VALUES (
            p_customer_id,
            v_transaction_id,
            v_total_amount,
            0,
            v_total_amount,
            'unpaid',
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
    END IF;

    -- 11. Loop Simpan Item Transaksi, Kurangi Stok, dan Catat Stock Movements
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type  := COALESCE(v_item->>'source_type', v_item->>'sourceType', 'product');
        v_item_id      := (v_item->>'id')::UUID;
        v_item_name    := COALESCE(v_item->>'name', v_item->>'displayName', 'Barang');
        v_variant_id   := CASE WHEN (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') != '' THEN (v_item->>'variant_id')::UUID ELSE NULL END;
        v_variant_name := v_item->>'variant_name';
        v_unit_name    := COALESCE(v_item->>'unit_name', v_item->>'unit', 'Pcs');
        v_price        := COALESCE((v_item->>'price')::NUMERIC, (v_item->>'selling_price')::NUMERIC, 0);
        v_quantity     := (v_item->>'quantity')::NUMERIC;
        v_subtotal     := ROUND(v_price * v_quantity, 2);

        -- Simpan ke transaction_items
        INSERT INTO public.transaction_items (
            transaction_id,
            product_id,
            temporary_price_id,
            item_name,
            variant_name,
            variant_id,
            unit_name,
            price,
            quantity,
            subtotal,
            source_type
        ) VALUES (
            v_transaction_id,
            CASE WHEN v_source_type = 'product' THEN v_item_id ELSE NULL END,
            CASE WHEN v_source_type = 'temporary' THEN v_item_id ELSE NULL END,
            v_item_name,
            v_variant_name,
            v_variant_id,
            v_unit_name,
            v_price,
            v_quantity,
            v_subtotal,
            v_source_type
        );

        -- Pemotongan Stok Produk Resmi
        IF v_source_type = 'product' AND v_item_id IS NOT NULL THEN
            IF v_variant_id IS NOT NULL THEN
                -- Varian Produk
                SELECT stock, minimum_stock INTO v_current_stock_int, v_min_stock
                FROM public.product_variants
                WHERE id = v_variant_id
                FOR UPDATE;

                IF v_current_stock_int IS NOT NULL THEN
                    v_new_stock := GREATEST(0, v_current_stock_int - ROUND(v_quantity)::INTEGER);

                    UPDATE public.product_variants
                    SET stock = v_new_stock::INTEGER,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = v_variant_id;

                    INSERT INTO public.stock_movements (
                        product_id,
                        variant_id,
                        movement_type,
                        quantity,
                        previous_stock,
                        new_stock,
                        reference_type,
                        reference_id,
                        notes,
                        created_by
                    ) VALUES (
                        v_item_id,
                        v_variant_id,
                        'out',
                        v_quantity,
                        v_current_stock_int,
                        v_new_stock,
                        'sale',
                        v_transaction_id,
                        'Penjualan POS ' || v_transaction_number || CASE WHEN p_payment_method = 'debt' THEN ' (Hutang)' ELSE '' END,
                        v_user_id
                    );
                END IF;
            ELSE
                -- Produk Tunggal
                SELECT stock INTO v_current_stock
                FROM public.products
                WHERE id = v_item_id
                FOR UPDATE;

                IF v_current_stock IS NOT NULL THEN
                    v_new_stock := GREATEST(0, v_current_stock - v_quantity);

                    UPDATE public.products
                    SET stock = v_new_stock,
                        updated_at = timezone('utc'::text, now())
                    WHERE id = v_item_id;

                    INSERT INTO public.stock_movements (
                        product_id,
                        movement_type,
                        quantity,
                        previous_stock,
                        new_stock,
                        reference_type,
                        reference_id,
                        notes,
                        created_by
                    ) VALUES (
                        v_item_id,
                        'out',
                        v_quantity,
                        v_current_stock,
                        v_new_stock,
                        'sale',
                        v_transaction_id,
                        'Penjualan POS ' || v_transaction_number || CASE WHEN p_payment_method = 'debt' THEN ' (Hutang)' ELSE '' END,
                        v_user_id
                    );
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- 12. Kembalikan Respons Sukses
    RETURN jsonb_build_object(
        'success',            true,
        'transaction_id',     v_transaction_id,
        'transaction_number', v_transaction_number,
        'total_quantity',     v_total_quantity,
        'total_amount',       v_total_amount,
        'payment_amount',     p_payment_amount,
        'change_amount',      v_change_amount,
        'payment_method',     p_payment_method,
        'customer_id',        p_customer_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Terjadi kesalahan transaksi: ' || SQLERRM
    );
END;
$$;

-- ==============================================================================
-- 7. RPC: pay_customer_debt (PEMBAYARAN / PELUNASAN HUTANG METODE FIFO)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.pay_customer_debt(
    p_customer_id       UUID,
    p_amount            NUMERIC,
    p_payment_method    TEXT,
    p_cashier_session_id UUID DEFAULT NULL,
    p_notes             TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id              UUID;
    v_session_id           UUID;
    v_session_status       TEXT;
    v_total_debt           NUMERIC(14,2) := 0;
    v_payment_remaining    NUMERIC(14,2);
    v_alloc_amount         NUMERIC(14,2);
    v_payment_id           UUID;
    v_debt_row             RECORD;
    v_new_paid             NUMERIC(14,2);
    v_new_remaining        NUMERIC(14,2);
    v_new_status           TEXT;
    v_customer_name        TEXT;
    v_new_total_remaining  NUMERIC(14,2) := 0;
BEGIN
    -- 1. Validasi Autentikasi Pengguna
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pengguna tidak terautentikasi.');
    END IF;

    -- 2. Validasi Data Pelanggan
    SELECT name INTO v_customer_name
    FROM public.customers
    WHERE id = p_customer_id;

    IF v_customer_name IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pelanggan tidak ditemukan.');
    END IF;

    -- 3. Validasi Nominal Pembayaran
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Nominal pembayaran harus lebih dari 0.');
    END IF;

    -- 4. Validasi Metode Pembayaran
    IF p_payment_method NOT IN ('cash', 'qris', 'transfer') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Metode pembayaran tidak valid. Gunakan cash, qris, atau transfer.');
    END IF;

    -- 5. Cek Sesi Kasir Aktif
    IF p_cashier_session_id IS NOT NULL THEN
        v_session_id := p_cashier_session_id;
    ELSE
        SELECT id INTO v_session_id
        FROM public.cashier_sessions
        WHERE cashier_id = v_user_id AND status = 'open'
        ORDER BY opened_at DESC
        LIMIT 1;
    END IF;

    -- 6. Hitung Total Sisa Hutang Pelanggan Saat Ini
    SELECT COALESCE(SUM(remaining_amount), 0) INTO v_total_debt
    FROM public.customer_debts
    WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partial');

    IF v_total_debt <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pelanggan ini tidak memiliki sisa hutang yang belum lunas.');
    END IF;

    -- 7. Validasi: Tolak Pembayaran Berlebih
    IF p_amount > v_total_debt THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Nominal pembayaran (Rp ' || to_char(p_amount, 'FM999,999,999') || ') melebihi sisa hutang pelanggan (Rp ' || to_char(v_total_debt, 'FM999,999,999') || ').'
        );
    END IF;

    -- 8. Simpan Catatan Pembayaran ke debt_payments
    INSERT INTO public.debt_payments (
        customer_id,
        amount,
        payment_method,
        cashier_session_id,
        received_by,
        payment_date,
        notes,
        created_at
    ) VALUES (
        p_customer_id,
        p_amount,
        p_payment_method,
        v_session_id,
        v_user_id,
        timezone('utc'::text, now()),
        p_notes,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_payment_id;

    -- 9. Alokasikan Pembayaran ke Hutang Tertua (FIFO)
    v_payment_remaining := p_amount;

    FOR v_debt_row IN (
        SELECT id, remaining_amount, paid_amount, original_amount
        FROM public.customer_debts
        WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partial')
        ORDER BY created_at ASC
        FOR UPDATE
    )
    LOOP
        IF v_payment_remaining <= 0 THEN
            EXIT;
        END IF;

        IF v_payment_remaining >= v_debt_row.remaining_amount THEN
            -- Hutang ini lunas sepenuhnya
            v_alloc_amount      := v_debt_row.remaining_amount;
            v_new_paid          := v_debt_row.paid_amount + v_alloc_amount;
            v_new_remaining     := 0;
            v_new_status        := 'paid';
            v_payment_remaining := v_payment_remaining - v_alloc_amount;
        ELSE
            -- Hutang ini dibayar sebagian
            v_alloc_amount      := v_payment_remaining;
            v_new_paid          := v_debt_row.paid_amount + v_alloc_amount;
            v_new_remaining     := v_debt_row.remaining_amount - v_alloc_amount;
            v_new_status        := 'partial';
            v_payment_remaining := 0;
        END IF;

        UPDATE public.customer_debts
        SET paid_amount      = v_new_paid,
            remaining_amount = v_new_remaining,
            status           = v_new_status,
            updated_at       = timezone('utc'::text, now())
        WHERE id = v_debt_row.id;
    END LOOP;

    -- 10. Hitung Sisa Hutang Terbaru Setelah Pembayaran
    SELECT COALESCE(SUM(remaining_amount), 0) INTO v_new_total_remaining
    FROM public.customer_debts
    WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partial');

    RETURN jsonb_build_object(
        'success',              true,
        'payment_id',           v_payment_id,
        'customer_id',          p_customer_id,
        'customer_name',        v_customer_name,
        'amount_paid',          p_amount,
        'payment_method',       p_payment_method,
        'previous_debt',        v_total_debt,
        'remaining_debt',       v_new_total_remaining,
        'is_fully_paid',        v_new_total_remaining <= 0
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Gagal memproses pembayaran hutang: ' || SQLERRM
    );
END;
$$;

-- ==============================================================================
-- 8. RPC: close_cashier_session (UPDATE REKONSILIASI PENJUALAN & PEMBAYARAN HUTANG)
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

    -- 3. Hitung Saldo Kas Fisik Seharusnya:
    -- expected_cash = opening_cash + cash_sales + cash_debt_payments
    v_expected_cash := v_session.opening_cash + v_cash_sales + v_cash_debt_payments;

    -- 4. Hitung Selisih Kas Fisik
    v_cash_diff := p_actual_cash - v_expected_cash;

    -- 5. Update Record Sesi Kasir Menjadi Ditutup
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
        'expected_cash',         v_expected_cash,
        'actual_cash',           p_actual_cash,
        'cash_difference',       v_cash_diff
    );
END;
$$;

-- Izin Eksekusi RPC
GRANT EXECUTE ON FUNCTION public.process_sale(UUID, TEXT, NUMERIC, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_customer_debt(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(UUID, NUMERIC, TEXT) TO authenticated;

-- RELOAD SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';
