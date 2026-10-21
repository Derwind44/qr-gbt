-- ========================================================
-- SOFT DELETE (Sampah): run once in Supabase SQL Editor BEFORE deploying the trash feature.
-- Safe to run more than once.
-- ========================================================

ALTER TABLE public.jemaat ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_jemaat_deleted_at ON public.jemaat(deleted_at) WHERE deleted_at IS NOT NULL;

-- Keep attendance history when a jemaat is purged for good: presensi keeps its own
-- full_name / id_jemaat, so any foreign key from presensi.jemaat_id must not cascade.
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE ns.nspname = 'public' AND rel.relname = 'presensi' AND con.contype = 'f'
      AND con.confrelid = 'public.jemaat'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.presensi DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
