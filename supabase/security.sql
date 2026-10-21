-- ========================================================
-- LOCK DOWN: run once in Supabase SQL Editor after deploying the server-side API.
-- The app now talks to the database only through Next.js API routes using
-- SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). The public anon key gets no access.
-- ========================================================

ALTER TABLE public.jemaat   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.jemaat   FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.presensi FORCE ROW LEVEL SECURITY;

-- Remove every existing policy on these tables (e.g. old "allow all" policies).
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('jemaat', 'sessions', 'presensi')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- No policies are created: anon and authenticated roles can neither read nor write.
REVOKE ALL ON public.jemaat, public.sessions, public.presensi FROM anon, authenticated;

-- Storage bucket for photo fallback: keep it private to the service role.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual ILIKE '%jemaat-photos%' OR with_check ILIKE '%jemaat-photos%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
