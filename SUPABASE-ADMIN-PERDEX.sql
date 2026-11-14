-- PerDex Admin security policies
-- Jalankan sekali di Supabase Dashboard > SQL Editor pada project PerNime.
-- Policy hanya memberi akses admin kepada email yang diset di server PerDex.
-- Jangan gunakan service_role key di browser.

ALTER TABLE public.perdex_reports
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open';

ALTER TABLE public.perdex_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perdex_reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE, DELETE ON TABLE public.perdex_reviews TO authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.perdex_reports TO authenticated;

DROP POLICY IF EXISTS "PerDex admin manage reviews" ON public.perdex_reviews;
CREATE POLICY "PerDex admin manage reviews"
  ON public.perdex_reviews
  FOR ALL
  TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'brooscraft9@gmail.com'
    AND lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '')) = 'google')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'brooscraft9@gmail.com'
    AND lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '')) = 'google');

DROP POLICY IF EXISTS "PerDex admin manage reports" ON public.perdex_reports;
CREATE POLICY "PerDex admin manage reports"
  ON public.perdex_reports
  FOR ALL
  TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email', '')) = 'brooscraft9@gmail.com'
    AND lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '')) = 'google')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email', '')) = 'brooscraft9@gmail.com'
    AND lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'provider', '')) = 'google');
