-- ============================================
-- FIX: "new row violates row-level security policy"
-- Jalankan di: Supabase Dashboard → SQL Editor → New query
-- Paste seluruh script ini, lalu klik Run
-- ============================================

-- 1. Hapus policy lama (abaikan error jika policy tidak ada)
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow select for all" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow insert for all" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow update for all" ON public.target_per_jabatan_site;
DROP POLICY IF EXISTS "Allow delete for all" ON public.target_per_jabatan_site;

-- 2. Buat policy baru
CREATE POLICY "target_select" ON public.target_per_jabatan_site FOR SELECT TO public USING (true);
CREATE POLICY "target_insert" ON public.target_per_jabatan_site FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "target_update" ON public.target_per_jabatan_site FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "target_delete" ON public.target_per_jabatan_site FOR DELETE TO public USING (true);
