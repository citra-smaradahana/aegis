-- =====================================================
-- UPDATE EXISTING TAKE 5 TRIGGER FUNCTION
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Check trigger yang sudah ada
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'update_take5_status_trigger';

-- 2. Check function yang sudah ada
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_take5_status_from_hazard';

-- 3. Update function Take 5 yang sudah ada (tanpa drop trigger)
CREATE OR REPLACE FUNCTION update_take5_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug: Log perubahan status
    RAISE NOTICE 'Take 5 Trigger fired: Hazard Report ID % status changed from % to %', 
        NEW.id, OLD.status, NEW.status;
    
    -- Jika hazard report status berubah menjadi 'closed' dan ada take_5_id
    IF NEW.status = 'closed' AND NEW.take_5_id IS NOT NULL THEN
        -- Update status Take 5 menjadi 'closed'
        UPDATE take_5 
        SET status = 'closed' 
        WHERE id = NEW.take_5_id;
        
        RAISE NOTICE 'Updated Take 5 status to closed for Take 5 ID: %', NEW.take_5_id;
    END IF;
    
    -- Jika hazard report status berubah menjadi 'closed' dan ada id_sumber_laporan (fallback)
    IF NEW.status = 'closed' AND NEW.take_5_id IS NULL AND NEW.sumber_laporan = 'Take5' AND NEW.id_sumber_laporan IS NOT NULL THEN
        -- Update status Take 5 menjadi 'closed' menggunakan id_sumber_laporan
        UPDATE take_5 
        SET status = 'closed' 
        WHERE id = NEW.id_sumber_laporan::UUID;
        
        RAISE NOTICE 'Updated Take 5 status to closed for Take 5 ID (from id_sumber_laporan): %', NEW.id_sumber_laporan;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Test trigger dengan update manual
-- Update satu hazard report Take 5 untuk test trigger
UPDATE hazard_report 
SET status = 'closed' 
WHERE id = (
    SELECT id 
    FROM hazard_report 
    WHERE sumber_laporan = 'Take5' 
    AND status != 'closed' 
    LIMIT 1
);

-- 5. Check apakah trigger berfungsi
SELECT 
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.take_5_id,
    hr.sumber_laporan,
    hr.id_sumber_laporan,
    t5.id as take5_id,
    t5.status as take5_status,
    t5.nama_observer
FROM hazard_report hr
LEFT JOIN take_5 t5 ON COALESCE(hr.take_5_id, hr.id_sumber_laporan::UUID) = t5.id
WHERE hr.sumber_laporan = 'Take5'
ORDER BY hr.created_at DESC;

-- 6. Check semua Take 5 status
SELECT 
    id,
    nama_observer,
    status,
    created_at
FROM take_5 
ORDER BY created_at DESC;

-- 7. Check apakah ada hazard report closed tapi Take 5 masih pending
SELECT 
    'TAKE 5 ISSUE CHECK' as info,
    hr.id as hazard_report_id,
    hr.status as hazard_status,
    hr.take_5_id,
    hr.sumber_laporan,
    t5.id as take5_id,
    t5.status as take5_status,
    t5.nama_observer
FROM hazard_report hr
LEFT JOIN take_5 t5 ON COALESCE(hr.take_5_id, hr.id_sumber_laporan::UUID) = t5.id
WHERE hr.status = 'closed' 
AND t5.status = 'pending'
ORDER BY hr.created_at DESC;
