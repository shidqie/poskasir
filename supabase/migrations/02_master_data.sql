-- ==============================================================================
-- KASIR TOKO SEMBAKO - SUPABASE DATABASE SCHEMA (TAHAP 2: MASTER DATA & HARGA)
-- ==============================================================================

-- 1. TABEL KATEGORI (categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index case-insensitive unik untuk nama kategori
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique ON public.categories (lower(name));
CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories (status);

-- 2. TABEL SATUAN (units)
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    allow_decimal BOOLEAN NOT NULL DEFAULT false,
    status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index unik untuk nama dan simbol satuan
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_name_unique ON public.units (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_symbol_unique ON public.units (lower(symbol));
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units (status);

-- 3. SEQUENCE & FUNCTION KODE BARANG OTOMATIS (BRG-0001, BRG-0002, ...)
CREATE SEQUENCE IF NOT EXISTS public.product_code_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS TEXT AS $$
DECLARE
    next_val BIGINT;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        next_val := nextval('public.product_code_seq');
        new_code := 'BRG-' || LPAD(next_val::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM public.products WHERE code = new_code) INTO code_exists;
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. TABEL DATA BARANG (products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    barcode TEXT NULL,
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    selling_price NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
    stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    minimum_stock NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    status BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk tabel products
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique ON public.products (barcode) WHERE barcode IS NOT NULL AND barcode <> '';
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products (name);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products (code);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON public.products (unit_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);

-- 5. TABEL RIWAYAT HARGA (product_price_history)
CREATE TABLE IF NOT EXISTS public.product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    old_price NUMERIC(14,2) NULL,
    new_price NUMERIC(14,2) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON public.product_price_history (product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_changed_at ON public.product_price_history (changed_at DESC);

-- Trigger Otomatis Pencatatan Riwayat Harga saat harga jual produk berubah
CREATE OR REPLACE FUNCTION public.handle_product_price_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.selling_price IS DISTINCT FROM NEW.selling_price) THEN
        INSERT INTO public.product_price_history (
            product_id,
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

DROP TRIGGER IF EXISTS trigger_product_price_history ON public.products;
CREATE TRIGGER trigger_product_price_history
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_price_history();

-- 6. TABEL BARANG BELUM TERDAFTAR (unregistered_prices)
CREATE TABLE IF NOT EXISTS public.unregistered_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode TEXT NULL,
    name TEXT NOT NULL,
    selling_price NUMERIC(14,2) NOT NULL CHECK (selling_price >= 0),
    unit_name TEXT NULL,
    notes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'inactive')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    converted_product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_unregistered_prices_name ON public.unregistered_prices (name);
CREATE INDEX IF NOT EXISTS idx_unregistered_prices_barcode ON public.unregistered_prices (barcode);
CREATE INDEX IF NOT EXISTS idx_unregistered_prices_status ON public.unregistered_prices (status);

-- 7. PASANG TRIGGER updated_at PADA SEMUA TABEL
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_units_updated_at ON public.units;
CREATE TRIGGER set_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_unregistered_prices_updated_at ON public.unregistered_prices;
CREATE TRIGGER set_unregistered_prices_updated_at
    BEFORE UPDATE ON public.unregistered_prices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unregistered_prices ENABLE ROW LEVEL SECURITY;

-- --- CATEGORIES ---
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON public.categories;
CREATE POLICY "Categories are viewable by authenticated users"
ON public.categories FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Categories can be managed by owner" ON public.categories;
CREATE POLICY "Categories can be managed by owner"
ON public.categories FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- --- UNITS ---
DROP POLICY IF EXISTS "Units are viewable by authenticated users" ON public.units;
CREATE POLICY "Units are viewable by authenticated users"
ON public.units FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Units can be managed by owner" ON public.units;
CREATE POLICY "Units can be managed by owner"
ON public.units FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- --- PRODUCTS ---
DROP POLICY IF EXISTS "Products are viewable by authenticated users" ON public.products;
CREATE POLICY "Products are viewable by authenticated users"
ON public.products FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Products can be managed by owner" ON public.products;
CREATE POLICY "Products can be managed by owner"
ON public.products FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- --- PRODUCT PRICE HISTORY ---
DROP POLICY IF EXISTS "Price history is viewable by authenticated users" ON public.product_price_history;
CREATE POLICY "Price history is viewable by authenticated users"
ON public.product_price_history FOR SELECT TO authenticated
USING (true);

-- --- UNREGISTERED PRICES ---
DROP POLICY IF EXISTS "Unregistered prices are viewable by authenticated users" ON public.unregistered_prices;
CREATE POLICY "Unregistered prices are viewable by authenticated users"
ON public.unregistered_prices FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Unregistered prices can be created by authenticated users" ON public.unregistered_prices;
CREATE POLICY "Unregistered prices can be created by authenticated users"
ON public.unregistered_prices FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Unregistered prices can be updated by owner" ON public.unregistered_prices;
CREATE POLICY "Unregistered prices can be updated by owner"
ON public.unregistered_prices FOR UPDATE TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- ==============================================================================
-- 9. SEED DATA AWAL (KATEGORI, SATUAN, & PRODUK SAMPLE)
-- ==============================================================================

-- Seed Kategori
INSERT INTO public.categories (name, status)
VALUES 
    ('Sembako', true),
    ('Mie Instan', true),
    ('Minuman', true),
    ('Makanan Ringan', true),
    ('Bumbu & Rempah', true),
    ('Sabun & Kebersihan', true),
    ('Kebutuhan Rumah Tangga', true)
ON CONFLICT DO NOTHING;

-- Seed Satuan
INSERT INTO public.units (name, symbol, allow_decimal, status)
VALUES 
    ('Pieces', 'Pcs', false, true),
    ('Bungkus', 'Bks', false, true),
    ('Botol', 'Btl', false, true),
    ('Kilogram', 'Kg', true, true),
    ('Gram', 'Gr', true, true),
    ('Liter', 'Ltr', true, true),
    ('Renteng', 'Rtg', false, true),
    ('Dus / Karton', 'Dus', false, true)
ON CONFLICT DO NOTHING;
