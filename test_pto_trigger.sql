-- =====================================================
-- TEST PTO TRIGGER - MANUAL UPDATE HAZARD REPORT STATUS
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Check status sebelum test
SELECT 
    'BEFORE TEST' as test_phase,
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.pto_id,
    hr.sumber_laporan,
    pto.id as pto_id,
    pto.status as pto_status,
    pto.nama_observer
FROM hazard_report hr
LEFT JOIN planned_task_observation pto ON COALESCE(hr.pto_id, hr.id_sumber_laporan::UUID) = pto.id
WHERE hr.sumber_laporan = 'PTO'
ORDER BY hr.created_at DESC;

-- 2. Manual update hazard report status untuk test trigger
-- Pilih hazard report yang sumber_laporan = 'PTO' dan status bukan 'closed'
UPDATE hazard_report 
SET status = 'closed' 
WHERE id = (
    SELECT id 
    FROM hazard_report 
    WHERE sumber_laporan = 'PTO' 
    AND status != 'closed' 
    ORDER BY created_at DESC
    LIMIT 1
);

-- 3. Check status setelah test
SELECT 
    'AFTER TEST' as test_phase,
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.pto_id,
    hr.sumber_laporan,
    pto.id as pto_id,
    pto.status as pto_status,
    pto.nama_observer
FROM hazard_report hr
LEFT JOIN planned_task_observation pto ON COALESCE(hr.pto_id, hr.id_sumber_laporan::UUID) = pto.id
WHERE hr.sumber_laporan = 'PTO'
ORDER BY hr.created_at DESC;

-- 4. Check semua PTO status
SELECT 
    'PTO STATUS SUMMARY' as info,
    COUNT(*) as total_pto,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_pto,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_pto
FROM planned_task_observation;

-- 5. List semua PTO dengan detail
SELECT 
    id,
    nama_observer,
    status,
    created_at
FROM planned_task_observation 
ORDER BY created_at DESC;

-- 6. Check apakah ada hazard report closed tapi PTO masih pending
SELECT 
    'ISSUE CHECK' as info,
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.pto_id,
    hr.sumber_laporan,
    pto.id as pto_id,
    pto.status as pto_status,
    pto.nama_observer
FROM hazard_report hr
LEFT JOIN planned_task_observation pto ON COALESCE(hr.pto_id, hr.id_sumber_laporan::UUID) = pto.id
WHERE hr.status = 'closed' 
AND pto.status = 'pending'
ORDER BY hr.created_at DESC;
