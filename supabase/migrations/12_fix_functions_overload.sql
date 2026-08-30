-- ==============================================================================
-- FIX: BERSIHKAN FUNCTION OVERLOAD & UPDATE SEMUA RPC DENGAN AMAN
-- Jalankan skrip ini di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Bersihkan semua versi lama/ganda dari fungsi-fungsi RPC
DO $CLEANUP$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_sig
        FROM pg_proc
        WHERE proname IN ('process_sale', 'close_cashier_session', 'open_cashier_session', 'record_cash_movement', 'pay_customer_debt')
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_sig || ' CASCADE;';
    END LOOP;
END $CLEANUP$;

-- 2. Buat Ulang RPC open_cashier_session
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

    SELECT id INTO v_active_id
    FROM public.cashier_sessions
    WHERE cashier_id = v_user_id AND status = 'open'
    LIMIT 1;

    IF v_active_id IS NOT NULL THEN
        RAISE EXCEPTION 'Kasir masih memiliki sesi aktif. Silakan tutup sesi sebelumnya terlebih dahulu.';
    END IF;

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
        'session', to_jsonb(v_session)
    );
END;
$$;

-- 3. Buat Ulang RPC process_sale (Dukungan Tunai, QRIS, Transfer, dan Hutang Pelanggan)
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
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna tidak terautentikasi.';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Keranjang belanja kosong. Masukkan minimal 1 barang.';
    END IF;

    SELECT id, status INTO v_session_id, v_session_status
    FROM public.cashier_sessions
    WHERE cashier_id = p_cashier_id AND status = 'open'
    LIMIT 1;

    IF v_session_id IS NULL THEN
        RAISE EXCEPTION 'Sesi kasir belum dibuka atau sudah ditutup. Buka kasir terlebih dahulu untuk transaksi.';
    END IF;

    IF p_payment_method NOT IN ('cash', 'qris', 'transfer', 'debt') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid: %. Gunakan cash, qris, transfer, atau debt.', p_payment_method;
    END IF;

    IF p_payment_method = 'debt' THEN
        IF p_customer_id IS NULL THEN
            RAISE EXCEPTION 'Untuk metode pembayaran HUTANG, wajib memilih data pelanggan.';
        END IF;

        SELECT EXISTS (
            SELECT 1 FROM public.customers WHERE id = p_customer_id AND is_active = true
        ) INTO v_customer_exists;

        IF NOT v_customer_exists THEN
            RAISE EXCEPTION 'Pelanggan tidak ditemukan atau berstatus tidak aktif.';
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity := (v_item->>'quantity')::NUMERIC;
        v_price    := (v_item->>'price')::NUMERIC;
        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Kuantitas barang harus lebih dari 0.';
        END IF;
        IF v_price < 0 THEN
            RAISE EXCEPTION 'Harga barang tidak boleh bernilai negatif.';
        END IF;
        v_subtotal := ROUND(v_quantity * v_price, 2);
        v_total_amount := v_total_amount + v_subtotal;
        v_total_quantity := v_total_quantity + v_quantity;
    END LOOP;

    IF p_payment_method = 'debt' THEN
        p_payment_amount := 0;
        v_change_amount := 0;
    ELSE
        IF p_payment_amount < v_total_amount THEN
            RAISE EXCEPTION 'Nominal bayar (Rp %) kurang dari total belanja (Rp %).', p_payment_amount, v_total_amount;
        END IF;
        v_change_amount := p_payment_amount - v_total_amount;
    END IF;

    v_today_str := to_char(timezone('Asia/Jakarta', now()), 'YYYYMMDD');
    SELECT COALESCE(MAX(
        CASE
            WHEN transaction_number ~ ('^TRX-' || v_today_str || '-[0-9]+$')
            THEN SUBSTRING(transaction_number FROM '[0-9]+$')::INTEGER
            ELSE 0
        END
    ), 0) + 1
    INTO v_daily_seq
    FROM public.transactions
    WHERE transaction_number LIKE 'TRX-' || v_today_str || '-%';

    v_transaction_number := 'TRX-' || v_today_str || '-' || LPAD(v_daily_seq::TEXT, 4, '0');

    INSERT INTO public.transactions (
        cashier_session_id,
        cashier_id,
        transaction_number,
        transaction_date,
        total_amount,
        total_quantity,
        payment_method,
        payment_amount,
        change_amount,
        customer_id,
        payment_status,
        created_at,
        updated_at
    ) VALUES (
        v_session_id,
        p_cashier_id,
        v_transaction_number,
        timezone('utc'::text, now()),
        v_total_amount,
        v_total_quantity,
        p_payment_method,
        p_payment_amount,
        v_change_amount,
        p_customer_id,
        CASE WHEN p_payment_method = 'debt' THEN 'unpaid' ELSE 'paid' END,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_transaction_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id      := NULL;
        v_variant_id   := NULL;
        v_source_type  := COALESCE(v_item->>'source_type', 'product');
        v_item_name    := COALESCE(v_item->>'name', 'Barang');
        v_variant_name := v_item->>'variant_name';
        v_unit_name    := COALESCE(v_item->>'unit_name', 'Pcs');
        v_quantity     := (v_item->>'quantity')::NUMERIC;
        v_price        := (v_item->>'price')::NUMERIC;
        v_subtotal     := ROUND(v_quantity * v_price, 2);

        IF v_source_type = 'variant' AND (v_item->>'id') IS NOT NULL THEN
            v_variant_id := (v_item->>'id')::UUID;
            SELECT pv.product_id, pv.stock, COALESCE(u.allow_decimal, false)
            INTO v_item_id, v_current_stock, v_allow_decimal
            FROM public.product_variants pv
            LEFT JOIN public.products p ON p.id = pv.product_id
            LEFT JOIN public.units u ON u.id = p.unit_id
            WHERE pv.id = v_variant_id
            FOR UPDATE;

            IF v_variant_id IS NOT NULL AND v_current_stock IS NOT NULL THEN
                v_new_stock := v_current_stock - v_quantity;
                UPDATE public.product_variants
                SET stock = v_new_stock, updated_at = timezone('utc'::text, now())
                WHERE id = v_variant_id;
            END IF;

        ELSIF v_source_type = 'product' AND (v_item->>'id') IS NOT NULL THEN
            v_item_id := (v_item->>'id')::UUID;
            SELECT p.stock, COALESCE(u.allow_decimal, false)
            INTO v_current_stock_int, v_allow_decimal
            FROM public.products p
            LEFT JOIN public.units u ON u.id = p.unit_id
            WHERE p.id = v_item_id
            FOR UPDATE;

            IF v_item_id IS NOT NULL AND v_current_stock_int IS NOT NULL THEN
                UPDATE public.products
                SET stock = GREATEST(0, v_current_stock_int - ROUND(v_quantity)::INTEGER),
                    updated_at = timezone('utc'::text, now())
                WHERE id = v_item_id;
            END IF;
        END IF;

        INSERT INTO public.transaction_items (
            transaction_id,
            product_id,
            variant_id,
            item_name,
            variant_name,
            unit_name,
            price,
            quantity,
            subtotal,
            created_at
        ) VALUES (
            v_transaction_id,
            v_item_id,
            v_variant_id,
            v_item_name,
            v_variant_name,
            v_unit_name,
            v_price,
            v_quantity,
            v_subtotal,
            timezone('utc'::text, now())
        );
    END LOOP;

    IF p_payment_method = 'debt' THEN
        INSERT INTO public.customer_debts (
            customer_id,
            transaction_id,
            amount,
            remaining_amount,
            status,
            notes,
            created_at,
            updated_at
        ) VALUES (
            p_customer_id,
            v_transaction_id,
            v_total_amount,
            v_total_amount,
            'unpaid',
            'Transaksi Hutang Kasir (' || v_transaction_number || ')',
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        );
    END IF;

    UPDATE public.cashier_sessions
    SET 
        transaction_count = transaction_count + 1,
        total_sales       = total_sales + v_total_amount,
        cash_sales        = cash_sales + CASE WHEN p_payment_method = 'cash' THEN v_total_amount ELSE 0 END,
        qris_sales        = qris_sales + CASE WHEN p_payment_method = 'qris' THEN v_total_amount ELSE 0 END,
        cash_tx_count     = cash_tx_count + CASE WHEN p_payment_method = 'cash' THEN 1 ELSE 0 END,
        qris_tx_count     = qris_tx_count + CASE WHEN p_payment_method = 'qris' THEN 1 ELSE 0 END,
        expected_cash     = expected_cash + CASE WHEN p_payment_method = 'cash' THEN v_total_amount ELSE 0 END,
        updated_at        = timezone('utc'::text, now())
    WHERE id = v_session_id;

    RETURN jsonb_build_object(
        'success',            true,
        'transaction_id',     v_transaction_id,
        'transaction_number', v_transaction_number,
        'total_amount',       v_total_amount,
        'total_quantity',     v_total_quantity,
        'payment_method',     p_payment_method,
        'payment_amount',     p_payment_amount,
        'change_amount',      v_change_amount,
        'customer_id',        p_customer_id,
        'cashier_session_id', v_session_id
    );
END;
$$;

-- 4. Buat Ulang RPC pay_customer_debt
CREATE OR REPLACE FUNCTION public.pay_customer_debt(
    p_customer_id    UUID,
    p_amount         NUMERIC,
    p_payment_method TEXT,
    p_notes          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id             UUID;
    v_session_id          UUID;
    v_customer_name       TEXT;
    v_total_debt          NUMERIC(14,2) := 0;
    v_remaining_to_pay    NUMERIC(14,2);
    v_debt_record         RECORD;
    v_allocated           NUMERIC(14,2);
    v_new_remaining       NUMERIC(14,2);
    v_payment_id          UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna tidak terautentikasi.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal pembayaran harus lebih dari 0.';
    END IF;

    IF p_payment_method NOT IN ('cash', 'qris', 'transfer') THEN
        RAISE EXCEPTION 'Metode pembayaran tidak valid: %. Gunakan cash, qris, atau transfer.', p_payment_method;
    END IF;

    SELECT name INTO v_customer_name
    FROM public.customers
    WHERE id = p_customer_id;

    IF v_customer_name IS NULL THEN
        RAISE EXCEPTION 'Data pelanggan tidak ditemukan.';
    END IF;

    SELECT COALESCE(SUM(remaining_amount), 0) INTO v_total_debt
    FROM public.customer_debts
    WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partially_paid');

    IF v_total_debt <= 0 THEN
        RAISE EXCEPTION 'Pelanggan % tidak memiliki hutang aktif.', v_customer_name;
    END IF;

    IF p_amount > v_total_debt THEN
        RAISE EXCEPTION 'Nominal pembayaran (Rp %) melebihi total sisa hutang pelanggan (Rp %).', p_amount, v_total_debt;
    END IF;

    SELECT id INTO v_session_id
    FROM public.cashier_sessions
    WHERE cashier_id = v_user_id AND status = 'open'
    LIMIT 1;

    INSERT INTO public.debt_payments (
        customer_id,
        cashier_session_id,
        amount,
        payment_method,
        notes,
        recorded_by,
        created_at
    ) VALUES (
        p_customer_id,
        v_session_id,
        p_amount,
        p_payment_method,
        TRIM(p_notes),
        v_user_id,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_payment_id;

    v_remaining_to_pay := p_amount;
    FOR v_debt_record IN 
        SELECT id, remaining_amount 
        FROM public.customer_debts
        WHERE customer_id = p_customer_id AND status IN ('unpaid', 'partially_paid')
        ORDER BY created_at ASC
        FOR UPDATE
    LOOP
        EXIT WHEN v_remaining_to_pay <= 0;

        IF v_remaining_to_pay >= v_debt_record.remaining_amount THEN
            v_allocated := v_debt_record.remaining_amount;
            UPDATE public.customer_debts
            SET remaining_amount = 0, status = 'paid', updated_at = timezone('utc'::text, now())
            WHERE id = v_debt_record.id;
            v_remaining_to_pay := v_remaining_to_pay - v_allocated;
        ELSE
            v_allocated := v_remaining_to_pay;
            v_new_remaining := v_debt_record.remaining_amount - v_allocated;
            UPDATE public.customer_debts
            SET remaining_amount = v_new_remaining, status = 'partially_paid', updated_at = timezone('utc'::text, now())
            WHERE id = v_debt_record.id;
            v_remaining_to_pay := 0;
        END IF;

        INSERT INTO public.debt_payment_allocations (
            debt_payment_id,
            debt_id,
            amount,
            created_at
        ) VALUES (
            v_payment_id,
            v_debt_record.id,
            v_allocated,
            timezone('utc'::text, now())
        );
    END LOOP;

    IF v_session_id IS NOT NULL AND p_payment_method = 'cash' THEN
        UPDATE public.cashier_sessions
        SET expected_cash = expected_cash + p_amount,
            updated_at    = timezone('utc'::text, now())
        WHERE id = v_session_id;
    END IF;

    RETURN jsonb_build_object(
        'success',        true,
        'payment_id',     v_payment_id,
        'customer_id',    p_customer_id,
        'customer_name',  v_customer_name,
        'amount_paid',    p_amount,
        'payment_method', p_payment_method,
        'previous_debt',  v_total_debt,
        'remaining_debt', v_total_debt - p_amount,
        'is_fully_paid',  (v_total_debt - p_amount) = 0
    );
END;
$$;

-- 5. Buat Ulang RPC record_cash_movement
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
    v_movement_id         UUID;
    v_current_cash        NUMERIC(14,2) := 0;
    v_cash_sales          NUMERIC(14,2) := 0;
    v_cash_debt_payments  NUMERIC(14,2) := 0;
    v_total_cash_in       NUMERIC(14,2) := 0;
    v_total_cash_out      NUMERIC(14,2) := 0;
    v_new_expected_cash   NUMERIC(14,2) := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna tidak terautentikasi.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Nominal uang harus lebih besar dari 0.';
    END IF;

    IF p_movement_type NOT IN ('cash_in', 'cash_out') THEN
        RAISE EXCEPTION 'Tipe mutasi tidak valid: %. Gunakan cash_in atau cash_out.', p_movement_type;
    END IF;

    IF TRIM(p_person_name) IS NULL OR TRIM(p_person_name) = '' THEN
        RAISE EXCEPTION 'Nama yang mengambil / menyetor uang wajib diisi.';
    END IF;

    IF TRIM(p_category) IS NULL OR TRIM(p_category) = '' THEN
        RAISE EXCEPTION 'Keperluan / Kategori mutasi kas wajib diisi.';
    END IF;

    SELECT * INTO v_session
    FROM public.cashier_sessions
    WHERE id = p_cashier_session_id
    FOR UPDATE;

    IF v_session.id IS NULL THEN
        RAISE EXCEPTION 'Sesi kasir tidak ditemukan.';
    END IF;

    IF v_session.status != 'open' THEN
        RAISE EXCEPTION 'Sesi kasir sudah ditutup. Mutasi kas hanya dapat dicatat pada sesi aktif.';
    END IF;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_cash_sales
    FROM public.transactions
    WHERE cashier_session_id = v_session.id AND payment_method = 'cash';

    SELECT COALESCE(SUM(amount), 0) INTO v_cash_debt_payments
    FROM public.debt_payments
    WHERE cashier_session_id = v_session.id AND payment_method = 'cash';

    SELECT 
        COALESCE(SUM(CASE WHEN movement_type = 'cash_in' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN movement_type = 'cash_out' THEN amount ELSE 0 END), 0)
    INTO v_total_cash_in, v_total_cash_out
    FROM public.cash_movements
    WHERE cashier_session_id = v_session.id;

    v_current_cash := v_session.opening_cash + v_cash_sales + v_cash_debt_payments + v_total_cash_in - v_total_cash_out;

    IF p_movement_type = 'cash_out' AND p_amount > v_current_cash THEN
        RAISE EXCEPTION 'Uang tunai di laci kasir tidak mencukupi! Saldo saat ini: Rp %, Nominal diambil: Rp %', 
            v_current_cash, p_amount;
    END IF;

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
        v_session.id,
        p_movement_type,
        p_amount,
        TRIM(p_category),
        TRIM(p_person_name),
        TRIM(p_notes),
        v_user_id,
        timezone('utc'::text, now())
    )
    RETURNING id INTO v_movement_id;

    IF p_movement_type = 'cash_in' THEN
        v_new_expected_cash := v_current_cash + p_amount;
    ELSE
        v_new_expected_cash := v_current_cash - p_amount;
    END IF;

    UPDATE public.cashier_sessions
    SET expected_cash = v_new_expected_cash,
        updated_at    = timezone('utc'::text, now())
    WHERE id = v_session.id;

    RETURN jsonb_build_object(
        'success',            true,
        'movement_id',        v_movement_id,
        'movement_type',      p_movement_type,
        'amount',             p_amount,
        'category',           TRIM(p_category),
        'person_name',        TRIM(p_person_name),
        'notes',              TRIM(p_notes),
        'available_cash_now', v_new_expected_cash,
        'cashier_session_id', v_session.id
    );
END;
$$;

-- 6. Buat Ulang RPC close_cashier_session
CREATE OR REPLACE FUNCTION public.close_cashier_session(
    p_session_id UUID,
    p_actual_cash NUMERIC,
    p_notes TEXT DEFAULT NULL
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
    v_qris_sales          NUMERIC(14,2) := 0;
    v_debt_sales          NUMERIC(14,2) := 0;
    v_total_sales         NUMERIC(14,2) := 0;
    v_cash_debt_payments  NUMERIC(14,2) := 0;
    v_qris_debt_payments  NUMERIC(14,2) := 0;
    v_total_debt_payments NUMERIC(14,2) := 0;
    v_cash_in             NUMERIC(14,2) := 0;
    v_cash_out            NUMERIC(14,2) := 0;
    v_expected_cash       NUMERIC(14,2) := 0;
    v_cash_diff           NUMERIC(14,2) := 0;
    v_tx_count            INTEGER := 0;
    v_cash_tx_count       INTEGER := 0;
    v_qris_tx_count       INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna tidak terautentikasi.';
    END IF;

    IF p_actual_cash < 0 THEN
        RAISE EXCEPTION 'Fisik uang tunai di laci tidak boleh bernilai negatif.';
    END IF;

    SELECT * INTO v_session
    FROM public.cashier_sessions
    WHERE id = p_session_id
    FOR UPDATE;

    IF v_session.id IS NULL THEN
        RAISE EXCEPTION 'Sesi kasir tidak ditemukan.';
    END IF;

    IF v_session.status = 'closed' THEN
        RAISE EXCEPTION 'Sesi kasir ini sudah ditutup sebelumnya pada %', v_session.closed_at;
    END IF;

    SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'debt' THEN total_amount ELSE 0 END), 0),
        COALESCE(SUM(total_amount), 0),
        COUNT(*),
        COUNT(CASE WHEN payment_method = 'cash' THEN 1 END),
        COUNT(CASE WHEN payment_method = 'qris' THEN 1 END)
    INTO
        v_cash_sales, v_qris_sales, v_debt_sales, v_total_sales,
        v_tx_count, v_cash_tx_count, v_qris_tx_count
    FROM public.transactions
    WHERE cashier_session_id = p_session_id;

    SELECT
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN payment_method = 'qris' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(amount), 0)
    INTO
        v_cash_debt_payments, v_qris_debt_payments, v_total_debt_payments
    FROM public.debt_payments
    WHERE cashier_session_id = p_session_id;

    SELECT
        COALESCE(SUM(CASE WHEN movement_type = 'cash_in' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN movement_type = 'cash_out' THEN amount ELSE 0 END), 0)
    INTO
        v_cash_in, v_cash_out
    FROM public.cash_movements
    WHERE cashier_session_id = p_session_id;

    v_expected_cash := v_session.opening_cash + v_cash_sales + v_cash_debt_payments + v_cash_in - v_cash_out;
    v_cash_diff     := p_actual_cash - v_expected_cash;

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

-- 7. Berikan Izin Eksekusi dengan Parameter Spesifik
GRANT EXECUTE ON FUNCTION public.open_cashier_session(NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale(UUID, TEXT, NUMERIC, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_customer_debt(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_cash_movement(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_cashier_session(UUID, NUMERIC, TEXT) TO authenticated;

-- 8. Reload schema PostgREST
NOTIFY pgrst, 'reload schema';
