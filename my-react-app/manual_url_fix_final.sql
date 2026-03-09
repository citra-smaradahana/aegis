-- =====================================================
-- MANUAL URL FIX FINAL - WITH CORRECT FILE NAMING
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. First, let's see what we have
SELECT 
    id,
    nama_observer,
    foto_temuan,
    'BEFORE FIX' as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 2. Update with complete URL using PTO ID as filename
-- Try .jpg first (most common)
UPDATE planned_task_observation 
SET foto_temuan = 'https://bzwgwndwmmaxdmuktasf.supabase.co/storage/v1/object/public/pto-evidence/' || id || '.jpg'
WHERE status = 'pending'
AND foto_temuan LIKE '%/pt';

-- 3. If .jpg doesn't work, try .jpeg
-- UPDATE planned_task_observation 
-- SET foto_temuan = 'https://bzwgwndwmmaxdmuktasf.supabase.co/storage/v1/object/public/pto-evidence/' || id || '.jpeg'
-- WHERE status = 'pending'
-- AND foto_temuan LIKE '%/pt';

-- 4. If .jpeg doesn't work, try .png
-- UPDATE planned_task_observation 
-- SET foto_temuan = 'https://bzwgwndwmmaxdmuktasf.supabase.co/storage/v1/object/public/pto-evidence/' || id || '.png'
-- WHERE status = 'pending'
-- AND foto_temuan LIKE '%/pt';

-- 5. Verify the fix
SELECT 
    id,
    nama_observer,
    foto_temuan,
    CASE 
        WHEN foto_temuan LIKE '%pto-evidence%' THEN 'FIXED'
        WHEN foto_temuan LIKE '%/pt' THEN 'STILL BROKEN'
        ELSE 'UNKNOWN'
    END as status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 6. Test the function again
SELECT * FROM get_pending_reports_for_hazard();
