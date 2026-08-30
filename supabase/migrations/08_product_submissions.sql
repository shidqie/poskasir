-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 10: FITUR PERSETUJUAN BARANG BARU (PRODUCT SUBMISSIONS)
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Buat tabel product_submissions
CREATE TABLE IF NOT EXISTS public.product_submissions (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type      TEXT          NOT NULL DEFAULT 'new_product' CHECK (submission_type IN ('new_product', 'new_variant')),
    parent_product_id    UUID          NULL REFERENCES public.products(id) ON DELETE SET NULL,
    name                 TEXT          NOT NULL,
    variant_name         TEXT          NULL,
    barcode              TEXT          NULL,
    selling_price        NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    unit_id              UUID          NULL REFERENCES public.units(id) ON DELETE SET NULL,
    category_id          UUID          NULL REFERENCES public.categories(id) ON DELETE SET NULL,
    notes                TEXT          NULL,
    status               TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_by         UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    submitted_at         TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by          UUID          NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at          TIMESTAMPTZ   NULL,
    rejection_reason     TEXT          NULL,
    approved_product_id  UUID          NULL REFERENCES public.products(id) ON DELETE SET NULL,
    approved_variant_id  UUID          NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Buat Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_submissions_status       ON public.product_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON public.product_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_barcode      ON public.product_submissions(barcode);
CREATE INDEX IF NOT EXISTS idx_submissions_parent       ON public.product_submissions(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created      ON public.product_submissions(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

-- Select Policy: Cashier dapat melihat miliknya atau barang pending (untuk daftar harga), Owner melihat semua
DROP POLICY IF EXISTS "Submissions select policy" ON public.product_submissions;
CREATE POLICY "Submissions select policy" ON public.product_submissions
    FOR SELECT TO authenticated
    USING (
        submitted_by = auth.uid() 
        OR status = 'pending' 
        OR public.is_owner()
    );

-- Insert Policy: Pengguna login dapat mengajukan dengan status 'pending' dan submitted_by = auth.uid()
DROP POLICY IF EXISTS "Submissions insert policy" ON public.product_submissions;
CREATE POLICY "Submissions insert policy" ON public.product_submissions
    FOR INSERT TO authenticated
    WITH CHECK (
        submitted_by = auth.uid()
        AND status = 'pending'
    );

-- Update Policy: HANYA Owner yang boleh mengupdate status pengajuan
DROP POLICY IF EXISTS "Submissions update policy by owner" ON public.product_submissions;
CREATE POLICY "Submissions update policy by owner" ON public.product_submissions
    FOR UPDATE TO authenticated
    USING (public.is_owner())
    WITH CHECK (public.is_owner());

-- Delete Policy: HANYA Owner yang boleh menghapus
DROP POLICY IF EXISTS "Submissions delete policy by owner" ON public.product_submissions;
CREATE POLICY "Submissions delete policy by owner" ON public.product_submissions
    FOR DELETE TO authenticated
    USING (public.is_owner());

-- ==============================================================================
-- 4. DATABASE RPC: approve_product_submission
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.approve_product_submission(
    p_submission_id   UUID,
    p_category_id     UUID DEFAULT NULL,
    p_unit_id         UUID DEFAULT NULL,
    p_cost_price      NUMERIC DEFAULT 0,
    p_initial_stock   NUMERIC DEFAULT 0,
    p_minimum_stock   NUMERIC DEFAULT 5,
    p_has_variants    BOOLEAN DEFAULT false,
    p_barcode         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub             public.product_submissions%ROWTYPE;
    v_barcode         TEXT;
    v_code            TEXT;
    v_new_product_id  UUID;
    v_new_variant_id  UUID;
    v_unit_id         UUID;
    v_category_id     UUID;
    v_cost_price      NUMERIC;
BEGIN
    -- 1. Validasi role: Hanya Pemilik yang boleh menyetujui
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Akses ditolak. Hanya Pemilik (Owner) yang dapat menyetujui pengajuan barang.';
    END IF;

    -- 2. Ambil data submission & kunci baris
    SELECT * INTO v_sub
    FROM public.product_submissions
    WHERE id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pengajuan barang tidak ditemukan.';
    END IF;

    IF v_sub.status != 'pending' THEN
        RAISE EXCEPTION 'Pengajuan ini sudah berstatus "%" dan tidak dapat disetujui lagi.', v_sub.status;
    END IF;

    -- Tentukan barcode & IDs final
    v_barcode     := COALESCE(NULLIF(TRIM(p_barcode), ''), NULLIF(TRIM(v_sub.barcode), ''));
    v_unit_id     := COALESCE(p_unit_id, v_sub.unit_id);
    v_category_id := COALESCE(p_category_id, v_sub.category_id);
    v_cost_price  := COALESCE(p_cost_price, 0);

    -- Fallback category jika null: ambil kategori pertama yang ada
    IF v_category_id IS NULL THEN
        SELECT id INTO v_category_id FROM public.categories ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- Fallback unit jika null: ambil unit pertama yang ada (mis. Pcs)
    IF v_unit_id IS NULL THEN
        SELECT id INTO v_unit_id FROM public.units ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- 3. Cek apakah barcode duplikat di produk resmi
    IF v_barcode IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.products WHERE barcode = v_barcode) THEN
            RAISE EXCEPTION 'Barcode "%" sudah digunakan oleh produk resmi lain.', v_barcode;
        END IF;
        IF EXISTS (SELECT 1 FROM public.product_variants WHERE barcode = v_barcode) THEN
            RAISE EXCEPTION 'Barcode "%" sudah digunakan oleh varian produk lain.', v_barcode;
        END IF;
    END IF;

    -- 4. Proses berdasarkan submission_type
    IF v_sub.submission_type = 'new_variant' AND v_sub.parent_product_id IS NOT NULL THEN
        -- Kasus A: Varian Baru
        INSERT INTO public.product_variants (
            product_id,
            name,
            barcode,
            price,
            stock,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            v_sub.parent_product_id,
            COALESCE(v_sub.variant_name, v_sub.name),
            v_barcode,
            v_sub.selling_price,
            COALESCE(p_initial_stock, 0),
            true,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        )
        RETURNING id INTO v_new_variant_id;

        -- Update produk induk agar has_variants = true
        UPDATE public.products
        SET has_variants = true,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_sub.parent_product_id;

        -- Update status submission
        UPDATE public.product_submissions
        SET status              = 'approved',
            approved_variant_id = v_new_variant_id,
            reviewed_by         = auth.uid(),
            reviewed_at         = timezone('utc'::text, now()),
            updated_at          = timezone('utc'::text, now())
        WHERE id = p_submission_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Varian produk berhasil disetujui & didaftarkan ke data resmi.',
            'variant_id', v_new_variant_id,
            'parent_product_id', v_sub.parent_product_id
        );

    ELSE
        -- Kasus B: Produk Baru Resmi
        -- Generate kode barang unik: PRD-XXXX
        v_code := 'PRD-' || LPAD((FLOOR(RANDOM() * 90000) + 10000)::TEXT, 5, '0');

        INSERT INTO public.products (
            name,
            code,
            barcode,
            category_id,
            unit_id,
            selling_price,
            stock,
            minimum_stock,
            has_variants,
            status,
            created_at,
            updated_at
        ) VALUES (
            TRIM(v_sub.name),
            v_code,
            v_barcode,
            v_category_id,
            v_unit_id,
            v_sub.selling_price,
            COALESCE(p_initial_stock, 0),
            COALESCE(p_minimum_stock, 5),
            COALESCE(p_has_variants, false),
            true,
            timezone('utc'::text, now()),
            timezone('utc'::text, now())
        )
        RETURNING id INTO v_new_product_id;

        -- Update status submission
        UPDATE public.product_submissions
        SET status              = 'approved',
            category_id         = v_category_id,
            unit_id             = v_unit_id,
            approved_product_id = v_new_product_id,
            reviewed_by         = auth.uid(),
            reviewed_at         = timezone('utc'::text, now()),
            updated_at          = timezone('utc'::text, now())
        WHERE id = p_submission_id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'Barang baru berhasil disetujui & resmi terdaftar di Data Barang.',
            'product_id', v_new_product_id
        );
    END IF;
END;
$$;

-- ==============================================================================
-- 5. DATABASE RPC: reject_product_submission
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.reject_product_submission(
    p_submission_id    UUID,
    p_rejection_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sub public.product_submissions%ROWTYPE;
BEGIN
    -- 1. Validasi role: Hanya Pemilik yang boleh menolak
    IF NOT public.is_owner() THEN
        RAISE EXCEPTION 'Akses ditolak. Hanya Pemilik (Owner) yang dapat menolak pengajuan barang.';
    END IF;

    IF TRIM(COALESCE(p_rejection_reason, '')) = '' THEN
        RAISE EXCEPTION 'Alasan penolakan wajib diisi.';
    END IF;

    -- 2. Ambil data submission & kunci baris
    SELECT * INTO v_sub
    FROM public.product_submissions
    WHERE id = p_submission_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Data pengajuan barang tidak ditemukan.';
    END IF;

    IF v_sub.status != 'pending' THEN
        RAISE EXCEPTION 'Pengajuan ini sudah berstatus "%" dan tidak dapat diubah lagi.', v_sub.status;
    END IF;

    -- 3. Update status menjadi rejected
    UPDATE public.product_submissions
    SET status           = 'rejected',
        rejection_reason = TRIM(p_rejection_reason),
        reviewed_by      = auth.uid(),
        reviewed_at      = timezone('utc'::text, now()),
        updated_at       = timezone('utc'::text, now())
    WHERE id = p_submission_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Pengajuan barang berhasil ditolak.'
    );
END;
$$;

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
