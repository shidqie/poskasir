-- ==============================================================================
-- KASIR TOKO SEMBAKO - MIGRATION 06: PRODUCT VARIANTS & VARIANT PRICE HISTORY
-- Jalankan di SQL Editor Supabase Dashboard
-- Aman untuk database yang sudah memiliki data produk & transaksi lama
-- ==============================================================================

-- 1. TAMBAHKAN FIELD has_variants PADA TABEL products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS has_variants BOOLEAN NOT NULL DEFAULT false;

-- 2. SEQUENCE & FUNCTION KODE VARIAN OTOMATIS (VAR-0001, VAR-0002, ...)
CREATE SEQUENCE IF NOT EXISTS public.variant_code_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_variant_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.variant_code_seq');
        new_code := 'VAR-' || LPAD(next_val::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM public.product_variants WHERE code = new_code) INTO code_exists;
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. TABEL VARIAN PRODUK (product_variants)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id    UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name  TEXT          NOT NULL,
    code          TEXT          NOT NULL UNIQUE,
    barcode       TEXT          NULL,
    selling_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    stock         NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    unit_id       UUID          NULL REFERENCES public.units(id) ON DELETE SET NULL,
    status        BOOLEAN       NOT NULL DEFAULT true,
    created_by    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk product_variants
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_barcode_unique 
    ON public.product_variants (barcode) 
    WHERE barcode IS NOT NULL AND barcode <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_pv_product_variant_name_unique 
    ON public.product_variants (product_id, lower(variant_name));

CREATE INDEX IF NOT EXISTS idx_pv_product_id   ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_pv_code         ON public.product_variants (code);
CREATE INDEX IF NOT EXISTS idx_pv_variant_name ON public.product_variants (variant_name);
CREATE INDEX IF NOT EXISTS idx_pv_status       ON public.product_variants (status);
CREATE INDEX IF NOT EXISTS idx_pv_unit_id      ON public.product_variants (unit_id);

-- Trigger updated_at pada product_variants
DROP TRIGGER IF EXISTS set_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_product_variants_updated_at
    BEFORE UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABEL RIWAYAT HARGA VARIAN (variant_price_history)
CREATE TABLE IF NOT EXISTS public.variant_price_history (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID          NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    old_price  NUMERIC(14,2) NULL,
    new_price  NUMERIC(14,2) NOT NULL,
    changed_by UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vph_variant_id ON public.variant_price_history (variant_id);
CREATE INDEX IF NOT EXISTS idx_vph_changed_at ON public.variant_price_history (changed_at DESC);

-- Trigger otomatis pencatatan riwayat harga varian
CREATE OR REPLACE FUNCTION public.handle_variant_price_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.selling_price IS DISTINCT FROM NEW.selling_price) THEN
        INSERT INTO public.variant_price_history (
            variant_id,
            old_price,
            new_price,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.selling_price,
            NEW.selling_price,
            COALESCE(NEW.updated_by, auth.uid()),
            timezone('utc'::text, now())
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_variant_price_history ON public.product_variants;
CREATE TRIGGER trigger_variant_price_history
    AFTER UPDATE ON public.product_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_variant_price_history();

-- 5. TAMBAH KOLOM variant_id & variant_name PADA transaction_items
ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL;

ALTER TABLE public.transaction_items
ADD COLUMN IF NOT EXISTS variant_name TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_ti_variant ON public.transaction_items (variant_id);

-- 6. TAMBAH KOLOM variant_id PADA stock_movements
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS variant_id UUID NULL REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sm_variant ON public.stock_movements (variant_id);

-- 7. UPDATE ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_price_history ENABLE ROW LEVEL SECURITY;

-- Product Variants RLS
DROP POLICY IF EXISTS "Variants are viewable by authenticated users" ON public.product_variants;
CREATE POLICY "Variants are viewable by authenticated users"
ON public.product_variants FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Variants can be managed by owner" ON public.product_variants;
CREATE POLICY "Variants can be managed by owner"
ON public.product_variants FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- Variant Price History RLS
DROP POLICY IF EXISTS "Variant price history viewable by authenticated" ON public.variant_price_history;
CREATE POLICY "Variant price history viewable by authenticated"
ON public.variant_price_history FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Variant price history managed by owner" ON public.variant_price_history;
CREATE POLICY "Variant price history managed by owner"
ON public.variant_price_history FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 8. PERBARUI FUNCTION process_sale() DENGAN DUKUNGAN VARIAN
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
    v_variant           RECORD;
    v_unreg             RECORD;
    v_total_quantity    NUMERIC := 0;
    v_total_amount      NUMERIC := 0;
    v_change_amount     NUMERIC := 0;
    v_transaction_id    UUID;
    v_transaction_number TEXT;
    v_idem_key          UUID;
    v_existing_trx_id   UUID;
    v_item_name         TEXT;
    v_variant_name      TEXT;
    v_item_price        NUMERIC;
    v_item_unit         TEXT;
    v_item_qty          NUMERIC;
    v_item_subtotal     NUMERIC;
    v_product_id        UUID;
    v_variant_id        UUID;
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

    -- 3. Idempotency Check – cegah checkout ganda
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

    -- 4. Validasi items tidak kosong
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Keranjang belanja kosong.');
    END IF;

    -- 5. Loop validasi setiap item (mengambil harga asli database)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;

        IF v_item_qty IS NULL OR v_item_qty <= 0 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Kuantitas barang tidak valid: ' || COALESCE(v_item->>'name', v_item->>'productName', '?'));
        END IF;

        IF v_source_type = 'product' THEN
            v_product_id := (v_item->>'productId')::UUID;
            v_variant_id := NULL;
            IF v_item->>'variantId' IS NOT NULL AND (v_item->>'variantId') <> '' THEN
                v_variant_id := (v_item->>'variantId')::UUID;
            END IF;

            -- Cek apakah transaksi menggunakan varian
            IF v_variant_id IS NOT NULL THEN
                -- Ambil data varian
                SELECT pv.id, pv.variant_name, pv.selling_price, pv.stock, pv.unit_id, p.name as product_name, p.unit_id as product_unit_id
                INTO v_variant
                FROM public.product_variants pv
                JOIN public.products p ON p.id = pv.product_id
                WHERE pv.id = v_variant_id AND pv.product_id = v_product_id AND pv.status = true AND p.status = true;

                IF NOT FOUND THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Varian produk tidak ditemukan atau nonaktif: ' || COALESCE(v_item->>'displayName', v_item->>'variantName', '?'));
                END IF;

                -- Validasi stok varian
                IF v_variant.stock < v_item_qty THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'Stok ' || v_variant.product_name || ' (' || v_variant.variant_name || ') tidak mencukupi. Tersedia: ' || v_variant.stock::TEXT
                    );
                END IF;

                v_item_price   := v_variant.selling_price;
                v_item_name    := v_variant.product_name;
                v_variant_name := v_variant.variant_name;

                -- Ambil satuan (utamakan satuan varian, fallback ke produk)
                SELECT symbol INTO v_item_unit FROM public.units WHERE id = COALESCE(v_variant.unit_id, v_variant.product_unit_id);
            ELSE
                -- Produk tunggal tanpa varian
                SELECT name, selling_price, stock, unit_id INTO v_product
                FROM public.products
                WHERE id = v_product_id AND status = true;

                IF NOT FOUND THEN
                    RETURN jsonb_build_object('success', false, 'error', 'Produk tidak ditemukan atau nonaktif: ' || COALESCE(v_item->>'name', v_item->>'productName', '?'));
                END IF;

                -- Validasi stok produk
                IF v_product.stock < v_item_qty THEN
                    RETURN jsonb_build_object(
                        'success', false,
                        'error', 'Stok ' || v_product.name || ' tidak mencukupi. Tersedia: ' || v_product.stock::TEXT
                    );
                END IF;

                v_item_price   := v_product.selling_price;
                v_item_name    := v_product.name;
                v_variant_name := NULL;

                SELECT symbol INTO v_item_unit FROM public.units WHERE id = v_product.unit_id;
            END IF;

            v_unreg_id := NULL;

        ELSIF v_source_type = 'temporary' THEN
            v_unreg_id := (v_item->>'temporaryPriceId')::UUID;

            SELECT name, selling_price, unit_name INTO v_unreg
            FROM public.unregistered_prices
            WHERE id = v_unreg_id AND status = 'pending';

            IF NOT FOUND THEN
                RETURN jsonb_build_object('success', false, 'error', 'Barang sementara tidak ditemukan: ' || COALESCE(v_item->>'name', '?'));
            END IF;

            v_item_price   := v_unreg.selling_price;
            v_item_name    := v_unreg.name;
            v_variant_name := NULL;
            v_item_unit    := v_unreg.unit_name;
            v_product_id   := NULL;
            v_variant_id   := NULL;
        ELSE
            RETURN jsonb_build_object('success', false, 'error', 'Tipe sumber barang tidak valid.');
        END IF;

        -- Akumulasi subtotal
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

    -- 8. Simpan transaksi utama
    INSERT INTO public.transactions (
        transaction_number, cashier_id, total_quantity, subtotal,
        total_amount, payment_amount, change_amount, payment_method, idempotency_key
    ) VALUES (
        v_transaction_number, v_cashier_id, v_total_quantity, v_total_amount,
        v_total_amount, p_payment_amount, v_change_amount,
        COALESCE(p_payment_method, 'cash'), v_idem_key
    ) RETURNING id INTO v_transaction_id;

    -- 9. Loop kedua: kurangi stok varian/produk, catat stock_movement, simpan transaction_items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_source_type := v_item->>'sourceType';
        v_item_qty    := (v_item->>'quantity')::NUMERIC;

        IF v_source_type = 'product' THEN
            v_product_id := (v_item->>'productId')::UUID;
            v_variant_id := NULL;
            IF v_item->>'variantId' IS NOT NULL AND (v_item->>'variantId') <> '' THEN
                v_variant_id := (v_item->>'variantId')::UUID;
            END IF;

            IF v_variant_id IS NOT NULL THEN
                -- Ambil varian
                SELECT pv.id, pv.variant_name, pv.selling_price, pv.stock, pv.unit_id, p.name as product_name, p.unit_id as product_unit_id
                INTO v_variant
                FROM public.product_variants pv
                JOIN public.products p ON p.id = pv.product_id
                WHERE pv.id = v_variant_id;

                SELECT symbol INTO v_item_unit FROM public.units WHERE id = COALESCE(v_variant.unit_id, v_variant.product_unit_id);

                v_item_price    := v_variant.selling_price;
                v_item_name     := v_variant.product_name;
                v_variant_name  := v_variant.variant_name;
                v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);
                v_stock_before  := v_variant.stock;
                v_stock_after   := v_stock_before - v_item_qty;

                -- Kurangi stok varian spesifik
                UPDATE public.product_variants
                SET stock = v_stock_after, updated_by = v_cashier_id, updated_at = now()
                WHERE id = v_variant_id;

                -- Catat stock movement varian
                INSERT INTO public.stock_movements (
                    product_id, variant_id, transaction_id, movement_type, quantity,
                    stock_before, stock_after, notes, created_by
                ) VALUES (
                    v_product_id, v_variant_id, v_transaction_id, 'sale', v_item_qty,
                    v_stock_before, v_stock_after,
                    'Transaksi ' || v_transaction_number || ' (' || v_variant_name || ')', v_cashier_id
                );
            ELSE
                -- Produk tanpa varian
                SELECT name, selling_price, stock, unit_id INTO v_product
                FROM public.products WHERE id = v_product_id;

                SELECT symbol INTO v_item_unit FROM public.units WHERE id = v_product.unit_id;

                v_item_price    := v_product.selling_price;
                v_item_name     := v_product.name;
                v_variant_name  := NULL;
                v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);
                v_stock_before  := v_product.stock;
                v_stock_after   := v_stock_before - v_item_qty;

                -- Kurangi stok produk
                UPDATE public.products
                SET stock = v_stock_after, updated_by = v_cashier_id, updated_at = now()
                WHERE id = v_product_id;

                -- Catat stock movement
                INSERT INTO public.stock_movements (
                    product_id, variant_id, transaction_id, movement_type, quantity,
                    stock_before, stock_after, notes, created_by
                ) VALUES (
                    v_product_id, NULL, v_transaction_id, 'sale', v_item_qty,
                    v_stock_before, v_stock_after,
                    'Transaksi ' || v_transaction_number, v_cashier_id
                );
            END IF;

            v_unreg_id := NULL;

        ELSE
            v_unreg_id    := (v_item->>'temporaryPriceId')::UUID;
            SELECT name, selling_price, unit_name INTO v_unreg FROM public.unregistered_prices WHERE id = v_unreg_id;
            v_item_price   := v_unreg.selling_price;
            v_item_name    := v_unreg.name;
            v_variant_name := NULL;
            v_item_unit    := v_unreg.unit_name;
            v_item_subtotal := ROUND(v_item_price * v_item_qty, 2);
            v_product_id   := NULL;
            v_variant_id   := NULL;
        END IF;

        -- Simpan item transaksi dengan variant_id dan variant_name
        INSERT INTO public.transaction_items (
            transaction_id, product_id, variant_id, temporary_price_id,
            item_name, variant_name, unit_name, price, quantity, subtotal, source_type
        ) VALUES (
            v_transaction_id, v_product_id, v_variant_id, v_unreg_id,
            v_item_name, v_variant_name, v_item_unit, v_item_price, v_item_qty, v_item_subtotal,
            v_source_type
        );
    END LOOP;

    -- 10. Kembalikan respons sukses
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

-- Izin eksekusi process_sale
REVOKE ALL ON FUNCTION public.process_sale FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_sale TO authenticated;

-- Izin sequence & helper function
GRANT USAGE, SELECT ON SEQUENCE public.variant_code_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_variant_code TO authenticated;

-- 9. RELOAD SCHEMA CACHE SUPABASE POSTGREST
NOTIFY pgrst, 'reload schema';
