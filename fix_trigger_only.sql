-- =====================================================
-- FIX TRIGGER FUNCTION ONLY - COLUMN NAME ISSUE
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- Fix trigger function untuk auto-fill nama dan NRP di PTO
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

-- Verify trigger function sudah ter-update
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'update_pto_user_info';
