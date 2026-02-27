-- SQL to FORCE REFRESH PTO names from user IDs
-- Run this if some names are missing or incorrect

BEGIN;

-- 1. Ensure columns exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planned_task_observation' AND column_name = 'nama_observee') THEN
        ALTER TABLE planned_task_observation ADD COLUMN nama_observee VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planned_task_observation' AND column_name = 'nama_observer_tambahan') THEN
        ALTER TABLE planned_task_observation ADD COLUMN nama_observer_tambahan VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planned_task_observation' AND column_name = 'nama_prosedur') THEN
        ALTER TABLE planned_task_observation ADD COLUMN nama_prosedur VARCHAR(255);
    END IF;
END $$;

-- 2. Force update ALL rows (this will trigger the update_pto_user_info function if it exists)
-- But better to run explicit UPDATE statements to be sure, in case the trigger is disabled or buggy.

-- Update nama_observee
UPDATE planned_task_observation p
SET nama_observee = u.nama
FROM users u
WHERE p.observee_id = u.id;

-- Update nama_observer_tambahan
UPDATE planned_task_observation p
SET nama_observer_tambahan = u.nama
FROM users u
WHERE p.observer_tambahan_id = u.id;

-- Update nama_prosedur
UPDATE planned_task_observation p
SET nama_prosedur = m.name
FROM master_prosedur m
WHERE p.prosedur_id = m.id;

-- 3. Also make sure the trigger is correctly defined (Redefine just in case)
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update nama_observer dan nrp_pelapor dari observer_id
    IF NEW.observer_id IS NOT NULL THEN
        SELECT nama, nrp, jabatan INTO NEW.nama_observer, NEW.nrp_pelapor, NEW.jabatan_pelapor
        FROM users WHERE id = NEW.observer_id;
    END IF;
    
    -- Update nrp_observer_tambahan DAN nama_observer_tambahan dari observer_tambahan_id
    IF NEW.observer_tambahan_id IS NOT NULL THEN
        SELECT nrp, nama INTO NEW.nrp_observer_tambahan, NEW.nama_observer_tambahan
        FROM users WHERE id = NEW.observer_tambahan_id;
    END IF;
    
    -- Update nrp_observee DAN nama_observee dari observee_id
    IF NEW.observee_id IS NOT NULL THEN
        SELECT nrp, nama INTO NEW.nrp_observee, NEW.nama_observee
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

COMMIT;
