-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 4: TRANSACTIONS, ITEMS, STOCK MOVEMENTS
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- HELPER: Fungsi generate nomor transaksi TRX-YYYYMMDD-XXXX
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_transaction_number()
RETURNS TEXT AS $$
DECLARE
    today_str TEXT;
    seq_num   INTEGER;
    new_number TEXT;
BEGIN
    today_str := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD');

    SELECT COUNT(*) + 1
    INTO seq_num
    FROM public.transactions
    WHERE transaction_date::date = (now() AT TIME ZONE 'Asia/Jakarta')::date;

    new_number := 'TRX-' || today_str || '-' || LPAD(seq_num::text, 4, '0');

    -- Pastikan unik, tambah seq jika bentrok
    WHILE EXISTS (SELECT 1 FROM public.transactions WHERE transaction_number = new_number) LOOP
        seq_num := seq_num + 1;
        new_number := 'TRX-' || today_str || '-' || LPAD(seq_num::text, 4, '0');
    END LOOP;

    RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. TABEL TRANSACTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT         UNIQUE NOT NULL,
    cashier_id         UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    transaction_date   TIMESTAMPTZ  NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    total_quantity     NUMERIC(14,3) NOT NULL DEFAULT 0,
    subtotal           NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
    change_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_method     TEXT          NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','qris','transfer')),
    status             TEXT          NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','cancelled')),
    idempotency_key    UUID          UNIQUE NOT NULL,
    notes              TEXT,
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transactions_cashier   ON public.transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON public.transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON public.transactions(status);

-- ------------------------------------------------------------------------------
-- 2. TABEL TRANSACTION_ITEMS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id       UUID          NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id           UUID          NULL REFERENCES public.products(id) ON DELETE SET NULL,
    temporary_price_id   UUID          NULL REFERENCES public.unregistered_prices(id) ON DELETE SET NULL,
    item_name            TEXT          NOT NULL,
    unit_name            TEXT,
    price                NUMERIC(14,2) NOT NULL,
    quantity             NUMERIC(14,3) NOT NULL,
    subtotal             NUMERIC(14,2) NOT NULL,
    source_type          TEXT          NOT NULL CHECK (source_type IN ('product','temporary')),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ti_transaction ON public.transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ti_product     ON public.transaction_items(product_id);

-- ------------------------------------------------------------------------------
-- 3. TABEL STOCK_MOVEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    transaction_id  UUID          NULL REFERENCES public.transactions(id) ON DELETE SET NULL,
    movement_type   TEXT          NOT NULL CHECK (movement_type IN ('sale','stock_in','adjustment','cancelled_sale')),
    quantity        NUMERIC(14,3) NOT NULL,
    stock_before    NUMERIC(14,3),
    stock_after     NUMERIC(14,3),
    notes           TEXT,
    created_by      UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sm_product     ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_sm_transaction ON public.stock_movements(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sm_created     ON public.stock_movements(created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. SUPABASE RPC: process_sale()
-- Seluruh logika transaksi berjalan di database (atomic)
-- Harga diambil dari database, BUKAN dari frontend
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_sale(
    p_items           JSONB,
    p_payment_amount  NUMERIC,
    p_payment_method  TEXT DEFAULT 'cash',
    p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cashier_id        UUID;
    v_cashier_role      TEXT;
    v_cashier_status    BOOLEAN;
    v_item              JSONB;
    v_product           RECORD;
    v_unreg             RECORD;
    v_total_quantity    NUMERIC := 0;
    v_total_amount      NUMERIC := 0;
    v_change_amount     NUMERIC := 0;
    v_transaction_id    UUID;
    v_transaction_number TEXT;
    v_idem_key          UUID;
    v_existing_trx_id   UUID;
    v_item_name         TEXT;
    v_item_price        NUMERIC;
    v_item_unit         TEXT;
    v_item_qty          NUMERIC;
    v_item_subtotal     NUMERIC;
    v_product_id        UUID;
    v_unreg_id          UUID;
    v_source_type       TEXT;
    v_stock_before      NUMERIC;
    v_stock_after       NUMERIC;
BEGIN
    -- 1. Verifikasi pengguna terautentikasi
    v_cashier_id := auth.uid();
    IF v_cashier_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda belum login. Silakan masuk kembali.');
    END IF;

    -- 2. Verifikasi role & status aktif
    SELECT role, status INTO v_cashier_role, v_cashier_status
    FROM public.profiles
    WHERE id = v_cashier_id;

    IF v_cashier_role NOT IN ('cashier','owner') OR v_cashier_status IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'Akun Anda tidak memiliki izin untuk melakukan transaksi.');
    END IF;

    -- 3. Idempotency Check – cegah checkout dobel
    v_idem_key := COALESCE(p_idempotency_key, gen_random_uuid());
    SELECT id INTO v_existing_trx_id
    FROM public.transactions
    WHERE idempotency_key = v_idem_key;

    IF v_existing_trx_id IS NOT NULL THEN
        -- Transaksi sudah ada, kembalikan data transaksi sebelumnya
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

    -- 4. Validasi items tidak kosong
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Keranjang belanja kosong.');
    END IF;

    -- 5. Loop validasi setiap item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;

        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Kuantitas barang tidak valid: ' || COALESCE(v_item->>'name','?'));
        END IF;

        IF v_source_type = 'product' THEN
            v_product_id := (v_item->>'productId')::UUID;

            -- Ambil data ASLI dari database (harga frontend diabaikan)
            SELECT name, selling_price, stock, unit_id INTO v_product
            FROM public.products
            WHERE id = v_product_id AND status = true;

            IF NOT FOUND THEN
                RETURN jsonb_build_object('success', false, 'error', 'Produk tidak ditemukan atau sudah tidak aktif: ' || COALESCE(v_item->>'name','?'));
            END IF;

            -- Validasi stok
            IF v_product.stock < v_item_qty THEN
                RETURN jsonb_build_object(
                    'success', false,
                    'error', 'Stok ' || v_product.name || ' tidak mencukupi. Tersedia: ' || v_product.stock::TEXT
                );
            END IF;

            v_item_price   := v_product.selling_price;
            v_item_name    := v_product.name;
            -- Ambil simbol satuan
            SELECT symbol INTO v_item_unit FROM public.units WHERE id = v_product.unit_id;
            v_unreg_id     := NULL;

        ELSIF v_source_type = 'temporary' THEN
            v_unreg_id := (v_item->>'temporaryPriceId')::UUID;

            SELECT name, selling_price, unit_name INTO v_unreg
            FROM public.unregistered_prices
            WHERE id = v_unreg_id AND status = 'pending';

            IF NOT FOUND THEN
                RETURN jsonb_build_object('success', false, 'error', 'Barang sementara tidak ditemukan: ' || COALESCE(v_item->>'name','?'));
            END IF;

            v_item_price   := v_unreg.selling_price;
            v_item_name    := v_unreg.name;
            v_item_unit    := v_unreg.unit_name;
            v_product_id   := NULL;
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Tipe sumber barang tidak valid.');
        END IF;

        -- Akumulasi total
        v_item_subtotal  := ROUND(v_item_price * v_item_qty, 2);
        v_total_quantity := v_total_quantity + v_item_qty;
        v_total_amount   := v_total_amount + v_item_subtotal;
    END LOOP;

    -- 6. Validasi pembayaran
    IF p_payment_amount < v_total_amount THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Uang yang diterima kurang. Kurang: Rp' || TO_CHAR(v_total_amount - p_payment_amount, 'FM999,999,999')
        );
    END IF;

    v_change_amount := ROUND(p_payment_amount - v_total_amount, 2);

    -- 7. Buat nomor transaksi unik
    v_transaction_number := public.generate_transaction_number();

    -- 8. Simpan transaksi
    INSERT INTO public.transactions (
        transaction_number, cashier_id, total_quantity, subtotal,
        total_amount, payment_amount, change_amount, payment_method, idempotency_key
    ) VALUES (
        v_transaction_number, v_cashier_id, v_total_quantity, v_total_amount,
        v_total_amount, p_payment_amount, v_change_amount,
        COALESCE(p_payment_method, 'cash'), v_idem_key
    ) RETURNING id INTO v_transaction_id;

    -- 9. Loop kedua: simpan items, kurangi stok, catat stock_movement
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;

        IF v_source_type = 'product' THEN
            v_product_id := (v_item->>'productId')::UUID;

            SELECT name, selling_price, stock, unit_id INTO v_product
            FROM public.products WHERE id = v_product_id;

            SELECT symbol INTO v_item_unit FROM public.units WHERE id = v_product.unit_id;

            v_item_price    := v_product.selling_price;
            v_item_name     := v_product.name;
            v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);
            v_stock_before  := v_product.stock;
            v_stock_after   := v_stock_before - v_item_qty;
            v_unreg_id      := NULL;

            -- Kurangi stok produk
            UPDATE public.products
            SET stock = v_stock_after, updated_by = v_cashier_id, updated_at = now()
            WHERE id = v_product_id;

            -- Catat stock movement
            INSERT INTO public.stock_movements (
                product_id, transaction_id, movement_type, quantity,
                stock_before, stock_after, notes, created_by
            ) VALUES (
                v_product_id, v_transaction_id, 'sale', v_item_qty,
                v_stock_before, v_stock_after,
                'Transaksi ' || v_transaction_number, v_cashier_id
            );

        ELSE
            v_unreg_id    := (v_item->>'temporaryPriceId')::UUID;
            SELECT name, selling_price, unit_name INTO v_unreg FROM public.unregistered_prices WHERE id = v_unreg_id;
            v_item_price  := v_unreg.selling_price;
            v_item_name   := v_unreg.name;
            v_item_unit   := v_unreg.unit_name;
            v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);
            v_product_id  := NULL;
        END IF;

        -- Simpan detail item transaksi
        INSERT INTO public.transaction_items (
            transaction_id, product_id, temporary_price_id, item_name,
            unit_name, price, quantity, subtotal, source_type
        ) VALUES (
            v_transaction_id, v_product_id, v_unreg_id, v_item_name,
            v_item_unit, v_item_price, v_item_qty, v_item_subtotal,
            v_source_type
        );
    END LOOP;

    -- 10. Return sukses
    RETURN jsonb_build_object(
        'success',            true,
        'transaction_id',     v_transaction_id,
        'transaction_number', v_transaction_number,
        'total_quantity',     v_total_quantity,
        'total_amount',       v_total_amount,
        'payment_amount',     p_payment_amount,
        'change_amount',      v_change_amount
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Terjadi kesalahan sistem: ' || SQLERRM
    );
END;
$$;

-- Berikan izin eksekusi hanya kepada authenticated users
REVOKE ALL ON FUNCTION public.process_sale FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_sale TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.transactions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements   ENABLE ROW LEVEL SECURITY;

-- Transactions: kasir hanya melihat miliknya, owner melihat semua
DROP POLICY IF EXISTS "Transactions by cashier" ON public.transactions;
CREATE POLICY "Transactions by cashier" ON public.transactions
    FOR SELECT TO authenticated
    USING (cashier_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "Transactions insert by auth" ON public.transactions;
CREATE POLICY "Transactions insert by auth" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (cashier_id = auth.uid());

-- Transaction Items: mengikuti akses transaksinya
DROP POLICY IF EXISTS "Transaction items via transaction" ON public.transaction_items;
CREATE POLICY "Transaction items via transaction" ON public.transaction_items
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions t
            WHERE t.id = transaction_id
            AND (t.cashier_id = auth.uid() OR public.is_owner())
        )
    );

DROP POLICY IF EXISTS "Transaction items insert by auth" ON public.transaction_items;
CREATE POLICY "Transaction items insert by auth" ON public.transaction_items
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Stock Movements: owner melihat semua, kasir melihat yang terkait transaksinya
DROP POLICY IF EXISTS "Stock movements viewable" ON public.stock_movements;
CREATE POLICY "Stock movements viewable" ON public.stock_movements
    FOR SELECT TO authenticated
    USING (public.is_owner() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Stock movements insert by auth" ON public.stock_movements;
CREATE POLICY "Stock movements insert by auth" ON public.stock_movements
    FOR INSERT TO authenticated
    WITH CHECK (true);
