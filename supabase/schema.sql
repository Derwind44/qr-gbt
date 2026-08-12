-- ========================================================
-- COMPLETE SUPABASE SCHEMA & COLUMNS FOR JEMAAT GBT TABLE
-- Copy and run this script in SQL Editor at Supabase Dashboard
-- ========================================================

-- 1. Create table public.jemaat if it doesn't exist
CREATE TABLE IF NOT EXISTS public.jemaat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_jemaat TEXT NOT NULL,
  qr_token TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT DEFAULT 'Laki-laki',
  nik TEXT,
  birth_place TEXT,
  birth_date TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  join_year TEXT,
  marital_status TEXT DEFAULT 'Belum Menikah',
  spouse_name TEXT,
  children_count TEXT DEFAULT '0',
  children_detail TEXT,
  father_name TEXT DEFAULT '-',
  mother_name TEXT DEFAULT '-',
  church_role TEXT DEFAULT 'Anggota',
  potentials JSONB DEFAULT '[]'::jsonb,
  is_joined_division TEXT DEFAULT 'Tidak',
  joined_divisions JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'Jemaat Umum',
  status TEXT DEFAULT 'Aktif',
  ktp_photo_url TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add all missing columns if table already existed
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS id_jemaat TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS qr_token TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Laki-laki';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS nik TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS join_year TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS marital_status TEXT DEFAULT 'Belum Menikah';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS spouse_name TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS children_count TEXT DEFAULT '0';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS children_detail TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS father_name TEXT DEFAULT '-';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS mother_name TEXT DEFAULT '-';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS church_role TEXT DEFAULT 'Anggota';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS potentials JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS is_joined_division TEXT DEFAULT 'Tidak';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS joined_divisions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Jemaat Umum';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aktif';
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS ktp_photo_url TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Drop legacy column
ALTER TABLE public.jemaat DROP COLUMN IF EXISTS qr_code_data;

-- 4. Fast search indexes
CREATE INDEX IF NOT EXISTS idx_jemaat_id_jemaat ON public.jemaat(id_jemaat);
CREATE INDEX IF NOT EXISTS idx_jemaat_qr_token ON public.jemaat(qr_token);
CREATE INDEX IF NOT EXISTS idx_jemaat_full_name ON public.jemaat(full_name);

-- 5. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
