-- ==============================================================================
-- KASIR TOKO SEMBAKO - SEED AKUN DEMO (PEMILIK & KASIR)
-- Jalankan script ini di SQL Editor Supabase untuk membuat akun demo langsung
-- ==============================================================================

-- 1. Pastikan ekstensi pgcrypto aktif untuk enkripsi password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Buat Akun PEMILIK di auth.users & public.profiles
DO $$
DECLARE
    pemilik_id UUID := 'a1111111-1111-1111-1111-111111111111';
    kasir_id UUID   := 'b2222222-2222-2222-2222-222222222222';
BEGIN
    -- Masukkan akun Pemilik ke auth.users jika belum ada
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'pemilik@toko.com') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            pemilik_id,
            'authenticated',
            'authenticated',
            'pemilik@toko.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Haji Sulaeman (Pemilik)","role":"owner"}',
            now(),
            now()
        );
    END IF;

    -- Masukkan profil Pemilik ke public.profiles
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (pemilik_id, 'Haji Sulaeman (Pemilik)', 'owner', true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, role = 'owner', status = true;

    -- Masukkan akun Kasir ke auth.users jika belum ada
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'kasir@toko.com') THEN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            kasir_id,
            'authenticated',
            'authenticated',
            'kasir@toko.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Siti Rahma (Kasir 1)","role":"cashier"}',
            now(),
            now()
        );
    END IF;

    -- Masukkan profil Kasir ke public.profiles
    INSERT INTO public.profiles (id, full_name, role, status)
    VALUES (kasir_id, 'Siti Rahma (Kasir 1)', 'cashier', true)
    ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, role = 'cashier', status = true;

END $$;
