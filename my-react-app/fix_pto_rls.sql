-- =====================================================
-- FIX PTO RLS POLICY ISSUE
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Drop existing policies
DROP POLICY IF EXISTS pto_site_policy ON planned_task_observation;
DROP POLICY IF EXISTS pto_insert_policy ON planned_task_observation;
DROP POLICY IF EXISTS pto_select_policy ON planned_task_observation;
DROP POLICY IF EXISTS pto_update_policy ON planned_task_observation;

-- 2. Option 1: Disable RLS temporarily untuk testing
ALTER TABLE planned_task_observation DISABLE ROW LEVEL SECURITY;

-- 3. Option 2: Jika ingin tetap enable RLS, gunakan policy yang lebih longgar
-- ALTER TABLE planned_task_observation ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY pto_all_policy ON planned_task_observation 
--     FOR ALL 
--     USING (true) 
--     WITH CHECK (true);

-- 4. Test insert (optional)
-- INSERT INTO planned_task_observation (
--     tanggal, site, detail_lokasi, alasan_observasi, 
--     observer_id, observee_id, pekerjaan_yang_dilakukan,
--     langkah_kerja_aman, apd_sesuai, area_kerja_aman, 
--     peralatan_aman, peduli_keselamatan, paham_resiko_prosedur,
--     status, created_by
-- ) VALUES (
--     CURRENT_DATE, 'BSIB', 'Test Area', 'Observasi Rutin',
--     (SELECT id FROM users LIMIT 1), (SELECT id FROM users LIMIT 1), 'Test Work',
--     true, true, true, true, true, true,
--     'pending', (SELECT id FROM users LIMIT 1)
-- );

-- 5. Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'planned_task_observation' 
ORDER BY ordinal_position;
