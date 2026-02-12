-- =====================================================
-- FIX PTO COMPLETE - FINAL COMPREHENSIVE SOLUTION
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. CHECK IF COLUMN EXISTS AND FIX DATA TYPE
-- Cek apakah kolom prosedur_id sudah ada
DO $$
BEGIN
    -- Jika kolom prosedur_id sudah ada, ubah tipe data saja
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'planned_task_observation' 
        AND column_name = 'prosedur_id'
    ) THEN
        -- Kolom sudah ada, ubah tipe data saja
        ALTER TABLE planned_task_observation 
        ALTER COLUMN prosedur_id TYPE VARCHAR(255);
        RAISE NOTICE 'Column prosedur_id already exists, data type updated to VARCHAR(255)';
    ELSE
        -- Jika kolom prosed_id ada, rename dulu
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'planned_task_observation' 
            AND column_name = 'prosed_id'
        ) THEN
            ALTER TABLE planned_task_observation 
            RENAME COLUMN prosed_id TO prosedur_id;
            ALTER TABLE planned_task_observation 
            ALTER COLUMN prosedur_id TYPE VARCHAR(255);
            RAISE NOTICE 'Column prosed_id renamed to prosedur_id and data type updated';
        ELSE
            -- Jika tidak ada keduanya, buat kolom baru
            ALTER TABLE planned_task_observation 
            ADD COLUMN prosedur_id VARCHAR(255);
            RAISE NOTICE 'New column prosedur_id created';
        END IF;
    END IF;
END $$;

-- 2. FIX TRIGGER FUNCTION - REMOVE PROSEDUR_ID FROM AUTO-FILL
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update nama_observer dan nrp_pelapor dari observer_id
    IF NEW.observer_id IS NOT NULL THEN
        SELECT nama, nrp, jabatan INTO NEW.nama_observer, NEW.nrp_pelapor, NEW.jabatan_pelapor
        FROM users WHERE id = NEW.observer_id;
    END IF;
    
    -- Update nrp_observer_tambahan dari observer_tambahan_id
    IF NEW.observer_tambahan_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_observer_tambahan
        FROM users WHERE id = NEW.observer_tambahan_id;
    END IF;
    
    -- Update nrp_observee dari observee_id
    IF NEW.observee_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_observee
        FROM users WHERE id = NEW.observee_id;
    END IF;
    
    -- Update nrp_pic dari pic_tindak_lanjut_id
    IF NEW.pic_tindak_lanjut_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_pic
        FROM users WHERE id = NEW.pic_tindak_lanjut_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. FIX HAZARD REPORT FUNCTION - CORRECT COLUMN NAMES
CREATE OR REPLACE FUNCTION create_hazard_report_from_pto(pto_id UUID)
RETURNS UUID AS $$
DECLARE
    hazard_id UUID;
    pto_record RECORD;
BEGIN
    -- Ambil data PTO
    SELECT * INTO pto_record FROM planned_task_observation WHERE id = pto_id;
    
    -- Buat hazard report dengan kolom yang benar
    INSERT INTO hazard_report (
        user_id,
        user_perusahaan,
        pelapor_nama,
        pelapor_nrp,
        lokasi,
        detail_lokasi,
        ketidaksesuaian,
        deskripsi_temuan,
        evidence,
        created_at,
        status,
        sumber_laporan,
        id_sumber_laporan
    ) VALUES (
        pto_record.created_by,
        NULL, -- user_perusahaan (akan diisi otomatis)
        pto_record.nama_observer,
        pto_record.nrp_pelapor,
        pto_record.site,
        pto_record.detail_lokasi,
        'Observasi Pekerjaan',
        pto_record.tindakan_perbaikan,
        pto_record.foto_temuan,
        NOW(),
        'Submit',
        'PTO',
        pto_record.id
    ) RETURNING id INTO hazard_id;
    
    -- Update status PTO menjadi pending
    UPDATE planned_task_observation 
    SET status = 'pending' 
    WHERE id = pto_id;
    
    RETURN hazard_id;
END;
$$ language 'plpgsql';

-- 4. VERIFY TABLE STRUCTURE
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'planned_task_observation' 
ORDER BY ordinal_position;

-- 5. VERIFY FUNCTIONS
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('update_pto_user_info', 'create_hazard_report_from_pto');

-- 6. VERIFY TRIGGERS
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'planned_task_observation';
