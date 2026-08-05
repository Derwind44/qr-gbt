-- ========================================================
-- SCHEMA SUPABASE UNTUK DATA JEMAAT / MEMBER
-- Jalankan query ini di SQL Editor di Supabase Dashboard
-- ========================================================

-- Create Table Jemaat
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

-- Indexing for fast search
CREATE INDEX IF NOT EXISTS idx_jemaat_qr ON public.jemaat(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_jemaat_name ON public.jemaat(full_name);
CREATE INDEX IF NOT EXISTS idx_jemaat_phone ON public.jemaat(phone);

-- Enable Row Level Security (RLS)
ALTER TABLE public.jemaat ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for scanner and directory app)
CREATE POLICY "Allow public read access" ON public.jemaat
    FOR SELECT USING (true);

-- Allow anonymous or service inserts/updates (or configure as needed)
CREATE POLICY "Allow public insert" ON public.jemaat
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON public.jemaat
    FOR UPDATE USING (true);

-- Insert Sample Data (Dummy data untuk pengujian awal)
INSERT INTO public.jemaat (qr_code_data, full_name, phone, email, category, address, city, status)
VALUES 
('gbt-8492019482', 'Budi Santoso', '081234567890', 'budi.santoso@gmail.com', 'Jemaat Umum', 'Jl. Merdeka No. 12', 'Jakarta', 'Aktif'),
('gbt-3920184729', 'Siti Rahmawati', '085678901234', 'siti.rahma@gmail.com', 'Pelayan', 'Jl. Melati No. 45', 'Surabaya', 'Aktif'),
('gbt-9182736450', 'Daniel Wijaya', '087812345678', 'daniel.w@gmail.com', 'Pemuda', 'Jl. Mawar No. 8', 'Bandung', 'Aktif'),
('gbt-5463728190', 'Grace Nathania', '082198765432', 'grace.n@gmail.com', 'Jemaat Umum', 'Jl. Diponegoro No. 88', 'Semarang', 'Aktif')
ON CONFLICT (qr_code_data) DO NOTHING;
