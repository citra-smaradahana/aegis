-- =====================================================
-- SAFE FIX - SET URL TO NULL IF FILE DOESN'T EXIST
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Show current problematic data
SELECT 
    id,
    nama_observer,
    foto_temuan,
    'BEFORE FIX' as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 2. Set foto_temuan to NULL (safe option if file doesn't exist)
UPDATE planned_task_observation 
SET foto_temuan = NULL
WHERE id = 'de03c9a7-9fcf-4549-aaf4-8a5ef18da8c1'
AND foto_temuan LIKE '%/pt';

-- 3. Verify the fix
SELECT 
    id,
    nama_observer,
    foto_temuan,
    CASE 
        WHEN foto_temuan IS NULL THEN 'NO FOTO (SAFE)'
        WHEN foto_temuan LIKE '%pto-evidence%' THEN 'FIXED'
        WHEN foto_temuan LIKE '%/pt' THEN 'STILL BROKEN'
        ELSE 'UNKNOWN'
    END as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 4. Test the function
SELECT * FROM get_pending_reports_for_hazard();
