-- ============================================================================
-- MIGRATION 13: HARGA BERDASARKAN SATUAN PENJUALAN (PRODUCT SALE UNITS)
-- Multi-Unit Pricing with Base Stock Conversion
-- ============================================================================

-- 1. Buat Tabel product_sale_units
CREATE TABLE IF NOT EXISTS public.product_sale_units (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id     UUID NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    conversion_qty NUMERIC(14,3) NOT NULL CHECK (conversion_qty > 0),
    selling_price  NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    barcode        TEXT NULL,
    is_default     BOOLEAN NOT NULL DEFAULT FALSE,
    status         BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order     INTEGER NOT NULL DEFAULT 0,
    created_by     UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by     UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index dan Constraint product_sale_units
CREATE INDEX IF NOT EXISTS idx_sale_units_product_id ON public.product_sale_units(product_id);
CREATE INDEX IF NOT EXISTS idx_sale_units_variant_id ON public.product_sale_units(variant_id);
CREATE INDEX IF NOT EXISTS idx_sale_units_status ON public.product_sale_units(status);
CREATE INDEX IF NOT EXISTS idx_sale_units_name ON public.product_sale_units(lower(name));

-- Barcode unik jika diisi
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_units_barcode_unique 
    ON public.product_sale_units(barcode) 
    WHERE barcode IS NOT NULL AND trim(barcode) != '';

-- Nama satuan unik per produk & varian
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_units_product_variant_name_unique
    ON public.product_sale_units(product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(trim(name)));

-- Hanya boleh 1 default per produk & varian
CREATE UNIQUE INDEX IF NOT EXISTS idx_sale_units_default_unique
    ON public.product_sale_units(product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
    WHERE is_default = TRUE;

-- 2. Buat Tabel sale_unit_price_history
CREATE TABLE IF NOT EXISTS public.sale_unit_price_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_unit_id UUID NOT NULL REFERENCES public.product_sale_units(id) ON DELETE CASCADE,
    old_price    NUMERIC(14,2) NULL,
    new_price    NUMERIC(14,2) NOT NULL,
    changed_by   UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sale_unit_price_hist_unit_id ON public.sale_unit_price_history(sale_unit_id);
CREATE INDEX IF NOT EXISTS idx_sale_unit_price_hist_changed_at ON public.sale_unit_price_history(changed_at DESC);

-- Trigger untuk mencatat perubahan harga satuan penjualan
CREATE OR REPLACE FUNCTION public.fn_track_sale_unit_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.sale_unit_price_history (sale_unit_id, old_price, new_price, changed_by, changed_at)
        VALUES (NEW.id, NULL, NEW.selling_price, NEW.created_by, timezone('utc'::text, now()));
    ELSIF (TG_OP = 'UPDATE' AND OLD.selling_price IS DISTINCT FROM NEW.selling_price) THEN
        INSERT INTO public.sale_unit_price_history (sale_unit_id, old_price, new_price, changed_by, changed_at)
        VALUES (NEW.id, OLD.selling_price, NEW.selling_price, NEW.updated_by, timezone('utc'::text, now()));
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sale_unit_price_change ON public.product_sale_units;
CREATE TRIGGER trg_sale_unit_price_change
    AFTER INSERT OR UPDATE OF selling_price ON public.product_sale_units
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_track_sale_unit_price_change();

-- 3. Tambah Kolom Satuan Penjualan di transaction_items (Jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transaction_items' AND column_name = 'sale_unit_id'
    ) THEN
        ALTER TABLE public.transaction_items 
        ADD COLUMN sale_unit_id UUID NULL REFERENCES public.product_sale_units(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transaction_items' AND column_name = 'sale_unit_name'
    ) THEN
        ALTER TABLE public.transaction_items 
        ADD COLUMN sale_unit_name TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'transaction_items' AND column_name = 'conversion_qty'
    ) THEN
        ALTER TABLE public.transaction_items 
        ADD COLUMN conversion_qty NUMERIC(14,3) NULL DEFAULT 1;
    END IF;
END $$;

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.product_sale_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_unit_price_history ENABLE ROW LEVEL SECURITY;

-- Policy product_sale_units:
DROP POLICY IF EXISTS "Authenticated users can view active sale units" ON public.product_sale_units;
CREATE POLICY "Authenticated users can view active sale units"
    ON public.product_sale_units
    FOR SELECT
    TO authenticated
    USING (
        status = TRUE OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Owner can manage sale units" ON public.product_sale_units;
CREATE POLICY "Owner can manage sale units"
    ON public.product_sale_units
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role = 'owner'
        )
    );

-- Policy sale_unit_price_history:
DROP POLICY IF EXISTS "Authenticated users can view sale unit price history" ON public.sale_unit_price_history;
CREATE POLICY "Authenticated users can view sale unit price history"
    ON public.sale_unit_price_history
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- 5. UPDATE RPC process_sale() DENGAN DUKUNGAN SATUAN PENJUALAN & KONVERSI STOK DASAR
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
    v_sale_unit_id        UUID;
    v_sale_unit_name      TEXT;
    v_conversion_qty      NUMERIC(14,3);
    v_unit_name           TEXT;
    v_price               NUMERIC(14,2);
    v_quantity            NUMERIC(14,3);
    v_subtotal            NUMERIC(14,2);
    v_source_type         TEXT;
    v_current_stock       NUMERIC(14,3);
    v_new_stock           NUMERIC(14,3);
    v_stock_to_deduct     NUMERIC(14,3);
    v_allow_decimal       BOOLEAN;
    v_today_str           TEXT;
    v_daily_seq           INTEGER;
    v_customer_exists     BOOLEAN;
    
    -- Record untuk verifikasi sale unit dari DB
    v_db_sale_unit        RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak: Pengguna tidak terautentikasi.';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Keranjang belanja kosong. Masukkan minimal 1 barang.';
    END IF;

    -- Validasi Sesi Kasir Aktif
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

    -- TAHAP 1: Hitung Total dan Verifikasi Harga dari Database
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_quantity      := (v_item->>'quantity')::NUMERIC;
        v_source_type   := COALESCE(v_item->>'sourceType', v_item->>'source_type', 'product');
        v_sale_unit_id  := NULL;
        v_price         := NULL;

        IF (v_item->>'saleUnitId') IS NOT NULL AND (v_item->>'saleUnitId') != '' THEN
            v_sale_unit_id := (v_item->>'saleUnitId')::UUID;
        ELSIF (v_item->>'sale_unit_id') IS NOT NULL AND (v_item->>'sale_unit_id') != '' THEN
            v_sale_unit_id := (v_item->>'sale_unit_id')::UUID;
        END IF;

        IF v_quantity <= 0 THEN
            RAISE EXCEPTION 'Kuantitas barang harus lebih dari 0.';
        END IF;

        -- Ambil harga dari DB jika ada sale_unit_id (Sumber Kebenaran Database)
        IF v_sale_unit_id IS NOT NULL THEN
            SELECT selling_price, conversion_qty, name INTO v_db_sale_unit
            FROM public.product_sale_units
            WHERE id = v_sale_unit_id AND status = true;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Satuan penjualan dengan ID % tidak ditemukan atau nonaktif.', v_sale_unit_id;
            END IF;

            v_price := v_db_sale_unit.selling_price;
        ELSE
            -- Fallback produk biasa / varian biasa / temporary
            v_price := (v_item->>'price')::NUMERIC;
        END IF;

        IF v_price < 0 THEN
            RAISE EXCEPTION 'Harga barang tidak boleh bernilai negatif.';
        END IF;

        v_subtotal       := ROUND(v_quantity * v_price, 2);
        v_total_amount   := v_total_amount + v_subtotal;
        v_total_quantity := v_total_quantity + v_quantity;
    END LOOP;

    -- Validasi Pembayaran
    IF p_payment_method = 'debt' THEN
        p_payment_amount := 0;
        v_change_amount  := 0;
    ELSE
        IF p_payment_amount < v_total_amount THEN
            RAISE EXCEPTION 'Nominal bayar (Rp %) kurang dari total belanja (Rp %).', p_payment_amount, v_total_amount;
        END IF;
        v_change_amount := p_payment_amount - v_total_amount;
    END IF;

    -- Buat Nomor Transaksi Unik Harian
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

    -- Simpan Master Transaksi
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

    -- TAHAP 2: Simpan Items dan Potong Stok Dasar
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id        := NULL;
        v_variant_id     := NULL;
        v_sale_unit_id   := NULL;
        v_sale_unit_name := NULL;
        v_conversion_qty := 1.0;
        v_source_type    := COALESCE(v_item->>'sourceType', v_item->>'source_type', 'product');
        v_item_name      := COALESCE(v_item->>'name', v_item->>'productName', 'Barang');
        v_variant_name   := COALESCE(v_item->>'variantName', v_item->>'variant_name');
        v_unit_name      := COALESCE(v_item->>'unit', v_item->>'unit_name', 'Pcs');
        v_quantity       := (v_item->>'quantity')::NUMERIC;
        v_price          := (v_item->>'price')::NUMERIC;

        IF (v_item->>'productId') IS NOT NULL AND (v_item->>'productId') != '' THEN
            v_item_id := (v_item->>'productId')::UUID;
        ELSIF (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') != '' THEN
            v_item_id := (v_item->>'product_id')::UUID;
        ELSIF v_source_type = 'product' AND (v_item->>'id') IS NOT NULL THEN
            v_item_id := (v_item->>'id')::UUID;
        END IF;

        IF (v_item->>'variantId') IS NOT NULL AND (v_item->>'variantId') != '' THEN
            v_variant_id := (v_item->>'variantId')::UUID;
        ELSIF (v_item->>'variant_id') IS NOT NULL AND (v_item->>'variant_id') != '' THEN
            v_variant_id := (v_item->>'variant_id')::UUID;
        ELSIF v_source_type = 'variant' AND (v_item->>'id') IS NOT NULL THEN
            v_variant_id := (v_item->>'id')::UUID;
        END IF;

        IF (v_item->>'saleUnitId') IS NOT NULL AND (v_item->>'saleUnitId') != '' THEN
            v_sale_unit_id := (v_item->>'saleUnitId')::UUID;
        ELSIF (v_item->>'sale_unit_id') IS NOT NULL AND (v_item->>'sale_unit_id') != '' THEN
            v_sale_unit_id := (v_item->>'sale_unit_id')::UUID;
        END IF;

        -- Jika menggunakan Sale Unit, verifikasi data terpercaya dari DB
        IF v_sale_unit_id IS NOT NULL THEN
            SELECT psu.selling_price, psu.conversion_qty, psu.name, psu.product_id, psu.variant_id
            INTO v_db_sale_unit
            FROM public.product_sale_units psu
            WHERE psu.id = v_sale_unit_id AND psu.status = true;

            IF FOUND THEN
                v_price          := v_db_sale_unit.selling_price;
                v_conversion_qty := v_db_sale_unit.conversion_qty;
                v_sale_unit_name := v_db_sale_unit.name;
                v_item_id        := COALESCE(v_item_id, v_db_sale_unit.product_id);
                v_variant_id     := COALESCE(v_variant_id, v_db_sale_unit.variant_id);
            END IF;
        END IF;

        v_subtotal        := ROUND(v_quantity * v_price, 2);
        v_stock_to_deduct := v_quantity * v_conversion_qty;

        -- POTONG STOK DASAR VARIAN
        IF v_variant_id IS NOT NULL THEN
            SELECT pv.product_id, pv.stock, COALESCE(u.allow_decimal, false), p.name, pv.variant_name
            INTO v_item_id, v_current_stock, v_allow_decimal, v_item_name, v_variant_name
            FROM public.product_variants pv
            JOIN public.products p ON p.id = pv.product_id
            LEFT JOIN public.units u ON u.id = p.unit_id
            WHERE pv.id = v_variant_id
            FOR UPDATE;

            IF v_current_stock IS NOT NULL THEN
                IF v_current_stock < v_stock_to_deduct THEN
                    RAISE EXCEPTION 'Stok % (%) tidak mencukupi. Kebutuhan: % %, Tersedia: % %.',
                        v_item_name, v_variant_name, v_stock_to_deduct, v_unit_name, v_current_stock, v_unit_name;
                END IF;

                v_new_stock := v_current_stock - v_stock_to_deduct;
                UPDATE public.product_variants
                SET stock = v_new_stock, updated_at = timezone('utc'::text, now())
                WHERE id = v_variant_id;

                -- Catat Stock Movement
                INSERT INTO public.stock_movements (
                    product_id,
                    variant_id,
                    movement_type,
                    quantity,
                    reference_id,
                    notes,
                    created_by,
                    created_at
                ) VALUES (
                    v_item_id,
                    v_variant_id,
                    'out',
                    v_stock_to_deduct,
                    v_transaction_id,
                    'Penjualan Kasir: ' || v_quantity || ' ' || COALESCE(v_sale_unit_name, v_unit_name) || ' (' || v_transaction_number || ')',
                    v_user_id,
                    timezone('utc'::text, now())
                );
            END IF;

        -- POTONG STOK DASAR PRODUK UTAMA (NON-VARIAN)
        ELSIF v_item_id IS NOT NULL AND v_source_type = 'product' THEN
            SELECT p.stock, COALESCE(u.allow_decimal, false), p.name
            INTO v_current_stock, v_allow_decimal, v_item_name
            FROM public.products p
            LEFT JOIN public.units u ON u.id = p.unit_id
            WHERE p.id = v_item_id
            FOR UPDATE;

            IF v_current_stock IS NOT NULL THEN
                IF v_current_stock < v_stock_to_deduct THEN
                    RAISE EXCEPTION 'Stok % tidak mencukupi. Kebutuhan: % %, Tersedia: % %.',
                        v_item_name, v_stock_to_deduct, v_unit_name, v_current_stock, v_unit_name;
                END IF;

                v_new_stock := v_current_stock - v_stock_to_deduct;
                UPDATE public.products
                SET stock = v_new_stock, updated_at = timezone('utc'::text, now())
                WHERE id = v_item_id;

                -- Catat Stock Movement
                INSERT INTO public.stock_movements (
                    product_id,
                    variant_id,
                    movement_type,
                    quantity,
                    reference_id,
                    notes,
                    created_by,
                    created_at
                ) VALUES (
                    v_item_id,
                    NULL,
                    'out',
                    v_stock_to_deduct,
                    v_transaction_id,
                    'Penjualan Kasir: ' || v_quantity || ' ' || COALESCE(v_sale_unit_name, v_unit_name) || ' (' || v_transaction_number || ')',
                    v_user_id,
                    timezone('utc'::text, now())
                );
            END IF;
        END IF;

        -- SIMPAN KE TRANSACTION_ITEMS
        INSERT INTO public.transaction_items (
            transaction_id,
            product_id,
            variant_id,
            sale_unit_id,
            sale_unit_name,
            conversion_qty,
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
            v_sale_unit_id,
            v_sale_unit_name,
            v_conversion_qty,
            v_item_name,
            v_variant_name,
            COALESCE(v_sale_unit_name, v_unit_name),
            v_price,
            v_quantity,
            v_subtotal,
            timezone('utc'::text, now())
        );
    END LOOP;

    -- Catat Hutang jika Pembayaran Metode Debt
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

    -- Update Akumulasi Sesi Kasir
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

-- Izin Eksekusi RPC
REVOKE ALL ON FUNCTION public.process_sale(UUID, TEXT, NUMERIC, JSONB, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_sale(UUID, TEXT, NUMERIC, JSONB, UUID) TO authenticated;

-- Reload Cache PostgREST
NOTIFY pgrst, 'reload schema';
