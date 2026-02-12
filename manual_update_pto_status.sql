-- =====================================================
-- MANUAL UPDATE PTO STATUS FOR EXISTING CLOSED HAZARD REPORTS
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Check hazard report yang sudah closed tapi PTO masih pending
SELECT 
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.pto_id,
    hr.sumber_laporan,
    pto.id as pto_id,
    pto.status as pto_status,
    pto.nama_observer,
    pto.created_at as pto_created_at
FROM hazard_report hr
LEFT JOIN planned_task_observation pto ON hr.pto_id = pto.id
WHERE hr.status = 'closed' 
AND hr.pto_id IS NOT NULL
AND pto.status = 'pending'
ORDER BY hr.created_at DESC;

-- 2. Manual update PTO status untuk hazard report yang sudah closed
UPDATE planned_task_observation 
SET status = 'closed'
WHERE id IN (
    SELECT hr.pto_id
    FROM hazard_report hr
    WHERE hr.status = 'closed' 
    AND hr.pto_id IS NOT NULL
);

-- 3. Check hasil update
SELECT 
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.pto_id,
    hr.sumber_laporan,
    pto.id as pto_id,
    pto.status as pto_status,
    pto.nama_observer
FROM hazard_report hr
LEFT JOIN planned_task_observation pto ON hr.pto_id = pto.id
WHERE hr.pto_id IS NOT NULL
ORDER BY hr.created_at DESC;

-- 4. Check PTO yang masih pending (seharusnya 0)
SELECT 
    COUNT(*) as total_pending_pto,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count
FROM planned_task_observation;

-- 5. List semua PTO dengan status
SELECT 
    id,
    nama_observer,
    status,
    created_at
FROM planned_task_observation 
ORDER BY created_at DESC;
