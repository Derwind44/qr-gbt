-- ========================================================
-- CLEAN & OPTIMIZED SUPABASE SCHEMA UNTUK DATA JEMAAT GBT
-- Jalankan query ini di SQL Editor di Supabase Dashboard
-- ========================================================

-- 1. Hapus kolom legasi qr_code_data yang sudah tidak dipakai
ALTER TABLE public.jemaat DROP COLUMN IF EXISTS qr_code_data;

-- 2. Isi data NULL pada id_jemaat & qr_token dengan nilai otomatis agar tidak error 23502
UPDATE public.jemaat 
SET id_jemaat = 'BU-' || upper(substring(replace(id::text, '-', ''), 1, 10))
WHERE id_jemaat IS NULL OR id_jemaat = '';

UPDATE public.jemaat 
SET qr_token = 'tok-' || replace(gen_random_uuid()::text, '-', '')
WHERE qr_token IS NULL OR qr_token = '';

-- 3. Atur kolom id_jemaat dan qr_token menjadi NOT NULL
ALTER TABLE public.jemaat ALTER COLUMN id_jemaat SET NOT NULL;
ALTER TABLE public.jemaat ALTER COLUMN qr_token SET NOT NULL;

-- 4. Buat Indeks Pencarian Otomatis & Cepat
CREATE INDEX IF NOT EXISTS idx_jemaat_id_jemaat ON public.jemaat(id_jemaat);
CREATE INDEX IF NOT EXISTS idx_jemaat_qr_token ON public.jemaat(qr_token);
CREATE INDEX IF NOT EXISTS idx_jemaat_full_name ON public.jemaat(full_name);
