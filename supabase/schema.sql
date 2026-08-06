-- ========================================================
-- SCHEMA SUPABASE & DUMMY DATA UNTUK DATA JEMAAT / MEMBER
-- Jalankan query ini di SQL Editor di Supabase Dashboard
-- ========================================================

-- 1. Create Table Jemaat (jika belum ada)
CREATE TABLE IF NOT EXISTS public.jemaat (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_code_data VARCHAR(50) UNIQUE NOT NULL, -- Format: gbt-XXXXXXXXXX
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    category VARCHAR(50) DEFAULT 'Jemaat Umum', -- Jemaat Umum, Pemuda, Anak, Pelayan, dll.
    address TEXT,
    city VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Aktif',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexing & Security Policies
CREATE INDEX IF NOT EXISTS idx_jemaat_qr ON public.jemaat(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_jemaat_name ON public.jemaat(full_name);

ALTER TABLE public.jemaat ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access') THEN
        CREATE POLICY "Allow public read access" ON public.jemaat FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert') THEN
        CREATE POLICY "Allow public insert" ON public.jemaat FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update') THEN
        CREATE POLICY "Allow public update" ON public.jemaat FOR UPDATE USING (true);
    END IF;
END $$;

-- 3. Insert Dummy Data Tambahan
INSERT INTO public.jemaat (qr_code_data, full_name, phone, email, category, address, city, status)
VALUES 
('gbt-8492019482', 'Budi Santoso', '081234567890', 'budi.santoso@gmail.com', 'Jemaat Umum', 'Jl. Merdeka No. 12, RT 02/05', 'Jakarta Pusat', 'Aktif'),
('gbt-3920184729', 'Siti Rahmawati', '085678901234', 'siti.rahma@gmail.com', 'Pelayan', 'Jl. Melati No. 45', 'Surabaya', 'Aktif'),
('gbt-9182736450', 'Daniel Wijaya', '087812345678', 'daniel.w@gmail.com', 'Pemuda', 'Jl. Mawar No. 8', 'Bandung', 'Aktif'),
('gbt-5463728190', 'Grace Nathania', '082198765432', 'grace.n@gmail.com', 'Jemaat Umum', 'Jl. Diponegoro No. 88', 'Semarang', 'Aktif'),
('gbt-1029384756', 'Michael Christian', '081399887766', 'michael.c@gmail.com', 'Anak', 'Jl. Pemuda No. 101', 'Yogyakarta', 'Aktif'),
('gbt-7788990011', 'Jonathan Edward', '081211223344', 'jonathan.e@gmail.com', 'Pelayan', 'Jl. Sudirman No. 15', 'Medan', 'Aktif'),
('gbt-6655443322', 'Esther Olivia', '085733445566', 'esther.o@gmail.com', 'Pemuda', 'Jl. Gajah Mada No. 22', 'Malang', 'Aktif'),
('gbt-9988776655', 'Samuel Harianja', '081988776655', 'samuel.h@gmail.com', 'Jemaat Umum', 'Jl. Veteran No. 50', 'Palembang', 'Aktif'),
('gbt-1122334455', 'Rachel Clarissa', '082244556677', 'rachel.c@gmail.com', 'Anak', 'Jl. Pahlawan No. 3', 'Solo', 'Aktif'),
('gbt-5544332211', 'David Setiawan', '087711223344', 'david.s@gmail.com', 'Pelayan', 'Jl. Gatot Subroto No. 77', 'Denpasar', 'Aktif')
ON CONFLICT (qr_code_data) DO NOTHING;
