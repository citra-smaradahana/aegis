-- =====================================================
-- FIX ALL SUPABASE ERRORS - CLEAN COMPREHENSIVE FIX
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor untuk memperbaiki semua error

-- 1. Drop semua function yang bermasalah terlebih dahulu
DROP FUNCTION IF EXISTS get_pending_reports_for_hazard();
DROP FUNCTION IF EXISTS create_hazard_report_from_pto(UUID);
DROP FUNCTION IF EXISTS update_pto_user_info();
DROP FUNCTION IF EXISTS update_pto_status_from_hazard();
DROP FUNCTION IF EXISTS update_take5_status_from_hazard();

-- 2. Drop semua trigger yang bermasalah
DROP TRIGGER IF EXISTS update_pto_user_info_trigger ON planned_task_observation;
DROP TRIGGER IF EXISTS update_pto_status_trigger ON hazard_report;
DROP TRIGGER IF EXISTS update_take5_status_trigger ON hazard_report;

-- 3. Pastikan kolom pic ada di planned_task_observation
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planned_task_observation' 
        AND column_name = 'pic'
    ) THEN
        ALTER TABLE planned_task_observation ADD COLUMN pic VARCHAR(255);
    END IF;
END $$;

-- 4. Buat function get_pending_reports_for_hazard yang benar
CREATE OR REPLACE FUNCTION get_pending_reports_for_hazard()
RETURNS TABLE (
    id UUID,
    sumber_laporan VARCHAR(10),
    nama_pelapor VARCHAR(100),
    tanggal DATE,
    detail_lokasi VARCHAR(100),
    deskripsi TEXT,
    site VARCHAR(100),
    nrp_pic VARCHAR(100),
    foto_temuan TEXT
) AS $$
BEGIN
    -- Return PTO pending with PIC
    RETURN QUERY
    SELECT
        p.id,
        'PTO'::VARCHAR(10) as sumber_laporan,
        p.nama_observer as nama_pelapor,
        p.tanggal,
        p.detail_lokasi,
        COALESCE(p.tindakan_perbaikan, 'Tidak ada deskripsi') as deskripsi,
        p.site,
        COALESCE(p.pic, p.nrp_pic, u.nama, '') as nrp_pic,
        p.foto_temuan
    FROM planned_task_observation p
    LEFT JOIN users u ON p.pic_tindak_lanjut_id = u.id
    WHERE p.status = 'pending'

    UNION ALL

    -- Return Take 5 pending
    SELECT
        t.id,
        'Take5'::VARCHAR(10) as sumber_laporan,
        COALESCE(t.nama, t.pelapor_nama) as nama_pelapor,
        t.tanggal,
        t.detail_lokasi,
        COALESCE(t.deskripsi_kondisi, 'Tidak ada deskripsi') as deskripsi,
        t.site,
        ''::VARCHAR(100) as nrp_pic,
        t.foto_temuan
    FROM take_5 t
    WHERE t.status = 'pending'
    AND t.hazard_id IS NULL

    ORDER BY tanggal DESC, sumber_laporan;
END;
$$ language 'plpgsql';

-- 5. Buat function create_hazard_report_from_pto yang benar
CREATE OR REPLACE FUNCTION create_hazard_report_from_pto(pto_id UUID)
RETURNS UUID AS $$
DECLARE
    pto_data RECORD;
    new_hazard_id UUID;
BEGIN
    -- Get PTO data
    SELECT * INTO pto_data
    FROM planned_task_observation
    WHERE id = pto_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PTO not found with ID: %', pto_id;
    END IF;
    
    -- Create hazard report
    INSERT INTO hazard_report (
        created_at,
        lokasi,
        detail_lokasi,
        deskripsi_temuan,
        action_plan,
        pic,
        evidence,
        status,
        pto_id,
        created_by
    ) VALUES (
        NOW(),
        pto_data.site,
        pto_data.detail_lokasi,
        COALESCE(pto_data.tindakan_perbaikan, 'Tidak ada deskripsi'),
        'Action plan akan ditentukan',
        pto_data.pic,
        pto_data.foto_temuan,
        'open',
        pto_id,
        pto_data.created_by
    ) RETURNING id INTO new_hazard_id;
    
    -- Update PTO status to closed
    UPDATE planned_task_observation 
    SET status = 'closed', hazard_id = new_hazard_id
    WHERE id = pto_id;
    
    RETURN new_hazard_id;
END;
$$ language 'plpgsql';

-- 6. Buat function update_pto_user_info yang benar
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update PIC name from users table
    IF NEW.pic_tindak_lanjut_id IS NOT NULL THEN
        SELECT nama INTO NEW.pic
        FROM users
        WHERE id = NEW.pic_tindak_lanjut_id;
    END IF;
    
    -- Update observer name
    IF NEW.observer_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_observer
        FROM users
        WHERE id = NEW.observer_id;
    END IF;
    
    -- Update observee name
    IF NEW.observee_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_observee
        FROM users
        WHERE id = NEW.observee_id;
    END IF;
    
    -- Update observer tambahan name
    IF NEW.observer_tambahan_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_observer_tambahan
        FROM users
        WHERE id = NEW.observer_tambahan_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Buat trigger untuk update_pto_user_info
CREATE TRIGGER update_pto_user_info_trigger
    BEFORE INSERT OR UPDATE ON planned_task_observation
    FOR EACH ROW
    EXECUTE FUNCTION update_pto_user_info();

-- 8. Buat function update_pto_status_from_hazard yang benar
CREATE OR REPLACE FUNCTION update_pto_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update PTO status when hazard report is closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        UPDATE planned_task_observation 
        SET status = 'closed'
        WHERE id = NEW.pto_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Buat trigger untuk update_pto_status_from_hazard
CREATE TRIGGER update_pto_status_trigger
    AFTER UPDATE ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_pto_status_from_hazard();

-- 10. Buat function update_take5_status_from_hazard yang benar
CREATE OR REPLACE FUNCTION update_take5_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Update Take 5 status when hazard report is closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        UPDATE take_5 
        SET status = 'closed'
        WHERE id = NEW.take_5_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Buat trigger untuk update_take5_status_from_hazard
CREATE TRIGGER update_take5_status_trigger
    AFTER UPDATE ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_take5_status_from_hazard();

-- 12. Fix PTO image URLs
UPDATE planned_task_observation 
SET foto_temuan = REPLACE(foto_temuan, '/pt', '/pto-evidence/')
WHERE status = 'pending'
AND foto_temuan LIKE '%/pt';

-- 13. Test semua function
SELECT 'Testing get_pending_reports_for_hazard' as test_name;
SELECT * FROM get_pending_reports_for_hazard() LIMIT 5;

SELECT 'Testing create_hazard_report_from_pto function exists' as test_name;
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_hazard_report_from_pto';

SELECT 'Testing triggers exist' as test_name;
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_name IN (
    'update_pto_user_info_trigger',
    'update_pto_status_trigger', 
    'update_take5_status_trigger'
);

-- 14. Verify table structure
SELECT 'Verifying planned_task_observation structure' as test_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'planned_task_observation' 
AND column_name IN ('pic', 'pic_tindak_lanjut_id', 'prosedur_id')
ORDER BY column_name;

-- =====================================================
-- SEMUA ERROR SUDAH DIPERBAIKI
-- =====================================================
