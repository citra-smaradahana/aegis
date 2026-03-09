-- =====================================================
-- FIX PTO STATUS TRIGGER - USE PTO_ID COLUMN
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Drop trigger lama yang menggunakan id_sumber_laporan
DROP TRIGGER IF EXISTS update_pto_status_trigger ON hazard_report;

-- 2. Drop function lama
DROP FUNCTION IF EXISTS update_pto_status_from_hazard();

-- 3. Buat function baru yang menggunakan pto_id
CREATE OR REPLACE FUNCTION update_pto_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika hazard report status berubah menjadi closed dan ada pto_id
    IF NEW.status = 'closed' AND NEW.pto_id IS NOT NULL THEN
        -- Update status PTO menjadi closed
        UPDATE planned_task_observation 
        SET status = 'closed' 
        WHERE id = NEW.pto_id;
        
        RAISE NOTICE 'Updated PTO status to closed for PTO ID: %', NEW.pto_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Buat trigger baru
CREATE TRIGGER update_pto_status_trigger
    AFTER UPDATE ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_pto_status_from_hazard();

-- 5. Test trigger dengan data existing
-- Update hazard report yang sudah closed tapi PTO masih pending
UPDATE hazard_report 
SET status = 'closed' 
WHERE status = 'closed' 
AND pto_id IS NOT NULL;

-- 6. Check hasil update
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

-- 7. Check PTO yang masih pending
SELECT 
    id,
    nama_observer,
    status,
    created_at
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;
