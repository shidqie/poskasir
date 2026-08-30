-- ==============================================================================
-- FIX AUTH & PROFILES RLS + AUTO-CREATE TRIGGER + AUTO-CONFIRM EMAILS
-- Jalankan di SQL Editor Supabase Dashboard
-- ==============================================================================

-- 1. Konfirmasi semua email user yang sudah terdaftar agar bisa login langsung
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email_confirmed_at IS NULL;

-- 2. Pastikan tabel profiles memiliki index & RLS yang tepat
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: User dapat melihat profilnya sendiri & Pemilik dapat melihat semua
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_owner());

-- Policy INSERT: User yang terotentikasi dapat membuat / menginsert profilnya sendiri
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy UPDATE: User dapat mengupdate profilnya sendiri & Pemilik dapat mengelola semua
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_owner())
WITH CHECK (auth.uid() = id OR public.is_owner());

-- Policy ALL untuk Pemilik
DROP POLICY IF EXISTS "Owner can manage all profiles" ON public.profiles;
CREATE POLICY "Owner can manage all profiles"
ON public.profiles FOR ALL TO authenticated
USING (public.is_owner())
WITH CHECK (public.is_owner());

-- 3. TRIGGER OTOMATIS: Buat profil setiap kali user baru mendaftar di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
BEGIN
    -- Ambil role dari raw_user_meta_data jika ada, atau fallback berdasarkan email
    v_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        CASE WHEN lower(NEW.email) LIKE '%kasir%' THEN 'cashier' ELSE 'owner' END
    );

    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (NEW.id, v_full_name, v_role, true)
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = true;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
