-- =====================================================
-- FIX RLS POLICIES - ENABLE PROPER ACCESS
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor setelah fix_all_supabase_errors.sql

-- 1. Disable RLS temporarily untuk testing
ALTER TABLE planned_task_observation DISABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_report DISABLE ROW LEVEL SECURITY;
ALTER TABLE take_5 DISABLE ROW LEVEL SECURITY;

-- 2. Create proper RLS policies for planned_task_observation
CREATE POLICY "Enable read access for all users" ON planned_task_observation
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON planned_task_observation
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON planned_task_observation
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. Create proper RLS policies for hazard_report
CREATE POLICY "Enable read access for all users" ON hazard_report
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON hazard_report
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON hazard_report
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Create proper RLS policies for take_5
CREATE POLICY "Enable read access for all users" ON take_5
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON take_5
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON take_5
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 5. Re-enable RLS
ALTER TABLE planned_task_observation ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazard_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE take_5 ENABLE ROW LEVEL SECURITY;

-- 6. Ensure storage bucket exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('pto-evidence', 'pto-evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Create storage policies for pto-evidence bucket
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (bucket_id = 'pto-evidence');

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pto-evidence' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'pto-evidence' 
        AND auth.role() = 'authenticated'
    );

-- 8. Test RLS policies
SELECT 'Testing RLS policies' as test_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('planned_task_observation', 'hazard_report', 'take_5')
ORDER BY tablename, policyname;

-- 9. Test storage bucket
SELECT 'Testing storage bucket' as test_name;
SELECT * FROM storage.buckets WHERE id = 'pto-evidence';

-- =====================================================
-- RLS POLICIES SUDAH DIPERBAIKI
-- =====================================================
