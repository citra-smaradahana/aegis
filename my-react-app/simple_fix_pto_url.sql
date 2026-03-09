-- =====================================================
-- SIMPLE FIX PTO URL - UPDATE DATABASE ONLY
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Check current problematic URL
SELECT 
    id,
    nama_observer,
    foto_temuan,
    'BEFORE FIX' as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 2. Fix the truncated URL by replacing /pt with /pto-evidence/
UPDATE planned_task_observation 
SET foto_temuan = REPLACE(foto_temuan, '/pt', '/pto-evidence/')
WHERE status = 'pending'
AND foto_temuan LIKE '%/pt';

-- 3. Verify the fix
SELECT 
    id,
    nama_observer,
    foto_temuan,
    'AFTER FIX' as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 4. Test the function
SELECT * FROM get_pending_reports_for_hazard();
