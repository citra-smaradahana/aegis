-- =====================================================
-- MANUAL FIX FOTO TEMUAN URL
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Show current problematic URL
SELECT 
    id,
    nama_observer,
    foto_temuan,
    'CURRENT' as status
FROM planned_task_observation 
WHERE status = 'pending'
AND foto_temuan LIKE '%/pt'
ORDER BY created_at DESC;

-- 2. Manually fix the URL by adding the missing parts
UPDATE planned_task_observation 
SET foto_temuan = foto_temuan || 'o-evidence/'
WHERE status = 'pending'
AND foto_temuan LIKE '%/pt'
AND foto_temuan NOT LIKE '%pto-evidence%';

-- 3. Alternative: Set a complete URL if the above doesn't work
-- UPDATE planned_task_observation 
-- SET foto_temuan = 'https://bzwgwndwmmaxdmuktasf.supabase.co/storage/v1/object/public/pto-evidence/default.jpg'
-- WHERE status = 'pending'
-- AND foto_temuan LIKE '%/pt';

-- 4. Verify the fix
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
