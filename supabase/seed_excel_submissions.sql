-- ==============================================================================
-- SEED 185 PENGAJUAN BARANG DARI EXCEL (Daftar_Barang_Full_dengan_Varian_dan_Harga.xlsx)
-- Status: pending (Menunggu Persetujuan Pemilik Toko)
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 0. Pastikan Tabel product_submissions Tersedia
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

CREATE INDEX IF NOT EXISTS idx_submissions_status       ON public.product_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_by ON public.product_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_submissions_barcode      ON public.product_submissions(barcode);
CREATE INDEX IF NOT EXISTS idx_submissions_created      ON public.product_submissions(created_at DESC);

ALTER TABLE public.product_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Submissions select policy" ON public.product_submissions;
CREATE POLICY "Submissions select policy" ON public.product_submissions
    FOR SELECT TO authenticated
    USING (submitted_by = auth.uid() OR status = 'pending' OR public.is_owner());

DROP POLICY IF EXISTS "Submissions insert policy" ON public.product_submissions;
CREATE POLICY "Submissions insert policy" ON public.product_submissions
    FOR INSERT TO authenticated
    WITH CHECK (submitted_by = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Submissions update policy by owner" ON public.product_submissions;
CREATE POLICY "Submissions update policy by owner" ON public.product_submissions
    FOR UPDATE TO authenticated
    USING (public.is_owner()) WITH CHECK (public.is_owner());

-- 1. Pastikan semua Kategori terdaftar
INSERT INTO public.categories (name) VALUES ('Biskuit & Wafer') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Kebersihan Rumah') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Makanan Bayi') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Minuman Dingin') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Minuman Sachet') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Obat & Kesehatan') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Perawatan Tubuh') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Perlengkapan Bayi') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Perlengkapan Rumah Tangga') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Rokok') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Sembako') ON CONFLICT DO NOTHING;
INSERT INTO public.categories (name) VALUES ('Snack & Makanan Ringan') ON CONFLICT DO NOTHING;

-- 2. Pastikan semua Satuan terdaftar
INSERT INTO public.units (name, symbol) VALUES ('2 L', '2 l') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('250 G', '250 g') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('250 Ml', '250 ml') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('500 G', '500 g') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Batang', 'batang') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Botol', 'botol') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Bungkus', 'bungkus') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Kaleng', 'kaleng') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Kg', 'kg') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Kotak', 'kotak') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Pack', 'pack') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Pcs', 'pcs') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Renteng', 'renteng') ON CONFLICT DO NOTHING;
INSERT INTO public.units (name, symbol) VALUES ('Sachet', 'sachet') ON CONFLICT DO NOTHING;

-- 3. Masukkan 185 Pengajuan Barang Baru ke product_submissions
DO $SEED$
DECLARE
    v_cashier_id UUID;
BEGIN
    SELECT id INTO v_cashier_id FROM public.profiles WHERE role = 'cashier' LIMIT 1;
    IF v_cashier_id IS NULL THEN
        SELECT id INTO v_cashier_id FROM public.profiles LIMIT 1;
    END IF;
    IF v_cashier_id IS NULL THEN
        RAISE EXCEPTION 'Tidak ditemukan profile user di database.';
    END IF;

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Water Orange', 'Botol', 8000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ultra Milk', 'Big', 6000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ultra Milk', 'Mini', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ultra Milk', 'Kecil - Strawberry', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ultra Milk', 'Kecil - Cokelat', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ultra Milk', 'Kecil - Full Cream', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nipis Madu', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Coca-Cola', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Fanta', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sprite', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'YOU C-1000', 'Botol', 8000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Pocari Sweat', 'Botol', 8000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Indomilk', 'Botol/kemasan biasa', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Indomilk Kids', 'Strawberry', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Indomilk Kids', 'Cokelat', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Teh Kotak', 'Kotak', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kopi ABC', 'Botol', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Botol', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sari Kacang Hijau', 'Besar', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sari Kacang Hijau', 'Kecil', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sari Asem', 'Botol', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Floridina', 'Orange', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Floridina', 'Coco', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Larutan Penyegar', 'Kaleng', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kaleng') OR lower(symbol) = lower('kaleng') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Larutan Penyegar', 'Botol besar', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Larutan Penyegar', 'Botol sedang', 6000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Larutan Penyegar', 'Botol kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Isoplus', 'Original', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Isoplus', 'Coco', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sunkist', 'Botol', 6000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Teh Pucuk', 'Botol', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1210/1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Le Minerale', 'Botol', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Aqua', 'Botol', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Pristine', 'Kecil', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Catatan lain menunjukkan Rp3.000; kemungkinan beda ukuran.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Pristine', 'Sedang', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Ukuran tidak ditulis; dibedakan karena terdapat dua harga.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'La Vida', 'Kecil', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Ukuran tidak ditulis; terdapat harga Rp2.000 dan Rp3.000.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'La Vida', 'Sedang', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Ukuran tidak ditulis; terdapat harga Rp2.000 dan Rp3.000.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Yogurt Cimory', 'Botol', 10000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ichitan', 'Milk Coffee', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ichitan', 'Korean Banana', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ichitan', 'Korean Strawberry', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ichitan', 'Chiz Tea', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Nama varian ditulis ''Chiz Tea''.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ichitan', 'Milk Tea', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'VJ Tea Tarik', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Harga Rp7.000 dicoret, diperbarui menjadi Rp5.000.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Golda Coffee', 'Botol', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Minute Maid', 'Pulpy', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Milku', 'Marie Biscuit', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Milku', 'Cokelat', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Milku', 'Strawberry', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tebs', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Noboo', 'Botol', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213 | Nama produk mengikuti tulisan pada catatan; perlu konfirmasi ejaan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kratingdaeng', 'Botol', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nutriboost', 'Botol', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Hydro Coco', 'Kotak', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kotak') OR lower(symbol) = lower('kotak') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tujuh Kurma', 'Botol', 9000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Susu Beruang', 'Kaleng', 11000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kaleng') OR lower(symbol) = lower('kaleng') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Fruit Tea', 'Botol', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Dingin') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('botol') OR lower(symbol) = lower('botol') LIMIT 1),
        'Sumber: IMG_1213'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Hilo', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'ABC Kopi Susu', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 18000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Beng-Beng Drink', 'Sachet', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Ditulis ''Bengbeng''.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Chocolatos', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Dancow', 'Sachet', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Energen', 'Kacang Hijau', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 21000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Energen', 'Vanila', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 21000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Energen', 'Cokelat', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 21000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Caribbean Nut', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Coolin'' Coffee', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Ejaan pada catatan kurang jelas.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Chococinno', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Mocacinno', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Freeze', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Good Day', 'Cappuccino', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 22000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Hilo', 'Calcium C', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Hilo', 'Calcium Smooth', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Nama varian mengikuti tulisan catatan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Indocafe', 'Coffee Mix', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Indocafe', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 17000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kapal Api', 'Reguler', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kapal Api', 'Kecil', 1000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 10000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nescafe', 'Sachet', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'White Koffie', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Wedang', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Ditulis ''Wdank/Wedank''; perlu konfirmasi merek.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Zee', 'Sachet', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Milo', 'Sachet', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (pack): Rp 40000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Susu Jahe', 'Sachet', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Harga Pack (renteng): Rp 12000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Top', 'Aren', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Creamy Latte', 'Sachet', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Minuman Sachet') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'SUN', 'Kacang Hijau', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'SUN', 'Ayam Kampung', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'SUN', 'Pisang Susu', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Promina', 'Hijau', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Varian ditulis berdasarkan warna kemasan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Promina', 'Kuning', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Varian ditulis berdasarkan warna kemasan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Promina', 'Merah', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Makanan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1214 | Varian ditulis berdasarkan warna kemasan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Telur', '1 kg', 26000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kg') OR lower(symbol) = lower('kg') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Telur', '500 gram', 13000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('500 g') OR lower(symbol) = lower('500 g') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Telur', '250 gram', 6500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('250 g') OR lower(symbol) = lower('250 g') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Bihun', '1 kg', 22000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kg') OR lower(symbol) = lower('kg') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Bihun', '500 gram', 11000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('500 g') OR lower(symbol) = lower('500 g') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Bihun', '250 gram', 5500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('250 g') OR lower(symbol) = lower('250 g') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kacang Suuk', '1 kg', 40000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kg') OR lower(symbol) = lower('kg') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kacang Suuk', '500 gram', 20000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('500 g') OR lower(symbol) = lower('500 g') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Kacang Suuk', '250 gram', 10000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('250 g') OR lower(symbol) = lower('250 g') LIMIT 1),
        'Sumber: IMG_1212/1215'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tepung Ketan', '1 kg', 18000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('kg') OR lower(symbol) = lower('kg') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Minyak Goreng', '250 ml', 7500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('250 ml') OR lower(symbol) = lower('250 ml') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Keju Kraft', 'Kemasan', 14000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gula', 'Kemasan kecil', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1212 | Berat tidak tertulis.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Minyak Goreng', '2 liter', 44000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('2 L') OR lower(symbol) = lower('2 L') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sasa', '250 gram', 13000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('250 g') OR lower(symbol) = lower('250 g') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sasa', 'Kecil', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Masako/Sedap', 'Sachet', 1000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ladaku', 'Sachet', 1000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ketumbar', 'Sachet', 1000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Desaku', 'Sachet', 1000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Desaku', 'Balado/Opor', 3500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Racik', '1 renteng', 18000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('renteng') OR lower(symbol) = lower('renteng') LIMIT 1),
        'Sumber: IMG_1211 | Harga eceran tidak tertulis.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Mie Instan', 'Satuan', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Top Ramen', 'Satuan', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sakura', 'Satuan', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Sembako') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Piattos', 'Satuan', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Snack & Makanan Ringan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'French Fries', 'Satuan', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Snack & Makanan Ringan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1212'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Chitato', 'Satuan', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Snack & Makanan Ringan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1216 | Harga tertulis pada daftar barang habis.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Yupi', 'Satuan', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Snack & Makanan Ringan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sari Gandum', 'Reguler', 11000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Marie Gold', 'Reguler', 9000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Malkist/Hatari', 'Reguler', 7000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216 | Harga Rp6.500 dicoret, diperbarui Rp7.000.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nabati', 'Reguler', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Roma Kelapa', 'Reguler', 9000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nissin', 'Reguler', 12000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Slai O''lai', 'Reguler', 10000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Better', 'Reguler', 8000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sereal', 'Satuan', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Coco Crunch', 'Reguler', 9000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Biskuit & Wafer') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pack') OR lower(symbol) = lower('pack') LIMIT 1),
        'Sumber: IMG_1216'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Pepsodent', 'Kecil', 6000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'GIV', 'Batang', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('batang') OR lower(symbol) = lower('batang') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nuvo', 'Batang', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('batang') OR lower(symbol) = lower('batang') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Charm', 'Softex', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Mama Lemon', 'Besar', 9000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Mama Lemon', 'Kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nuvo', 'Cair sedang', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Nuvo', 'Cair kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sabun Boom', 'Kemasan', 5000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Kebersihan Rumah') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Ekonomi', 'Kemasan', 10000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Kebersihan Rumah') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tissue Tessa', 'Kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perlengkapan Rumah Tangga') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1210'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Paseo', 'Kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perlengkapan Rumah Tangga') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1210'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'MamyPoko', 'Satuan', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perlengkapan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1210'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Happy', 'Satuan', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perlengkapan Bayi') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1210'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Cotton Buds Prima', 'Kecil', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Perawatan Tubuh') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1211'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tolak Angin', 'Dewasa', 4000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1217'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tolak Angin', 'Anak', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1217'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Komix', 'Kid', 1500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1217'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Komix', 'Dewasa', 2000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1217'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Mixagrip', 'Kemasan', 3000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('pcs') OR lower(symbol) = lower('pcs') LIMIT 1),
        'Sumber: IMG_1217 | Catatan menuliskan Rp3.000 / Rp1.000; bentuk penjualan perlu dikonfirmasi. | Harga Pack (ecer alternatif): Rp 1000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Adem Sari', 'Sachet', 2500.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Obat & Kesehatan') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('sachet') OR lower(symbol) = lower('sachet') LIMIT 1),
        'Sumber: IMG_1217'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum Super', 'Bungkus', 25000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Harga Pack (batang): Rp 2500'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum Coklat 16', 'Bungkus', 18000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Harga Pack (batang): Rp 1500'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum Coklat Extra', 'Bungkus', 17000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum Coklat Elite', 'Bungkus', 18000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum 76', 'Apple', 16000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Tebu', 'Bungkus', 12000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Nama mengikuti catatan; perlu konfirmasi merek.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'L.A', 'Ice Click', 35000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Djarum 76', 'Apel Royal', 17000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Evo', 'Biru', 26000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Clas Mild', 'Bungkus', 20000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Camel', 'Biru', 25000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'GA', 'Bungkus', 20000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Nama ditulis ''GA''; perlu konfirmasi merek. | Harga Pack (batang): Rp 1000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Sejati Kretek', 'Bungkus', 11000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'S Mild', 'Original', 36000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'S Mild', 'Menthol', 36000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gudang Garam Kretek', 'Hijau', 17000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Harga Pack (batang): Rp 1500'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gudang Garam Kretek', 'Prima', 16000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Magnum', 'Kretek', 15000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Magnum', 'Filter', 27000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Harga Pack (batang): Rp 2500'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Magnum', 'Bintang', 29000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Varian ditandai simbol bintang pada catatan. | Harga Pack (batang): Rp 2000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Dji Sam Soe', '12', 21000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Harga Pack (batang): Rp 1500'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Dji Sam Soe', 'Refill', 25000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Ejaan varian pada catatan kurang jelas.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Dunhill', 'Original', 28000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Nama pada catatan kurang jelas; disesuaikan dengan merek yang terlihat. | Harga Pack (batang): Rp 2000'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Dunhill', 'Red', 25000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Avolution', 'Bungkus', 44000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Marlboro', 'M/P', 54000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209 | Kode varian mengikuti catatan.'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Marlboro', 'Filter Black', 40000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'TWIZZ', 'Bungkus', 27000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gudang Garam Filter', 'Bungkus', 27000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gudang Garam Signature', 'Bungkus', 27000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Surya', '16', 36000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Surya', '12', 27000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Gudang Garam Merah Kretek', 'Bungkus', 17000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

    INSERT INTO public.product_submissions (
        name, variant_name, selling_price, status, submitted_by, category_id, unit_id, notes
    ) VALUES (
        'Raden', 'Bungkus', 10000.0, 'pending', v_cashier_id,
        (SELECT id FROM public.categories WHERE lower(name) = lower('Rokok') LIMIT 1),
        (SELECT id FROM public.units WHERE lower(name) = lower('bungkus') OR lower(symbol) = lower('bungkus') LIMIT 1),
        'Sumber: IMG_1209'
    );

END $SEED$;

NOTIFY pgrst, 'reload schema';