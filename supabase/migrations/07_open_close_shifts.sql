-- ==============================================================================
-- KASIR TOKO SEMBAKO - TAHAP 9: FITUR BUKA & TUTUP KASIR (SHIFT MANAGEMENT)
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Tambah kolom opening_cash, status, opened_at ke tabel cash_closings
ALTER TABLE public.cash_closings 
ADD COLUMN IF NOT EXISTS opening_cash NUMERIC(14,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('open', 'closed')),
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS cash_sales NUMERIC(14,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS non_cash_sales NUMERIC(14,2) NOT NULL DEFAULT 0;

-- 2. Update indeks
CREATE INDEX IF NOT EXISTS idx_closings_status ON public.cash_closings(status);

-- 3. RLS update policy for cash_closings (agar kasir bisa mengupdate shift miliknya saat tutup)
DROP POLICY IF EXISTS "Closings update by cashier" ON public.cash_closings;
CREATE POLICY "Closings update by cashier" ON public.cash_closings
    FOR UPDATE TO authenticated
    USING (cashier_id = auth.uid() OR public.is_owner())
    WITH CHECK (cashier_id = auth.uid() OR public.is_owner());

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
