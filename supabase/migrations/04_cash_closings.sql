-- ==============================================================================
-- TAHAP 8: TUTUP KASIR / CASH CLOSING
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.cash_closings (
    id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id        UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    closing_date      DATE          NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
    transaction_count INTEGER       NOT NULL DEFAULT 0,
    total_sales       NUMERIC(14,2) NOT NULL DEFAULT 0,
    system_cash       NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Total dari sistem
    actual_cash       NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Input kasir
    difference        NUMERIC(14,2) GENERATED ALWAYS AS (actual_cash - system_cash) STORED,
    notes             TEXT,
    closed_at         TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(cashier_id, closing_date)
);

CREATE INDEX IF NOT EXISTS idx_closings_cashier ON public.cash_closings(cashier_id);
CREATE INDEX IF NOT EXISTS idx_closings_date    ON public.cash_closings(closing_date DESC);

-- RLS
ALTER TABLE public.cash_closings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Closings select" ON public.cash_closings;
CREATE POLICY "Closings select" ON public.cash_closings
    FOR SELECT TO authenticated
    USING (cashier_id = auth.uid() OR public.is_owner());

DROP POLICY IF EXISTS "Closings insert by cashier" ON public.cash_closings;
CREATE POLICY "Closings insert by cashier" ON public.cash_closings
    FOR INSERT TO authenticated
    WITH CHECK (cashier_id = auth.uid());
