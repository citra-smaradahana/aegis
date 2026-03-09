-- Add missing columns to planned_task_observation table
ALTER TABLE planned_task_observation 
ADD COLUMN IF NOT EXISTS nrp_pelapor VARCHAR(50),
ADD COLUMN IF NOT EXISTS nama_observer VARCHAR(100),
ADD COLUMN IF NOT EXISTS jabatan_pelapor VARCHAR(100),
ADD COLUMN IF NOT EXISTS nrp_observer_tambahan VARCHAR(50),
ADD COLUMN IF NOT EXISTS nrp_observee VARCHAR(50),
ADD COLUMN IF NOT EXISTS nrp_pic VARCHAR(50);

-- Fix Trigger Function for PTO (Correct column name from 'name' to 'nama')
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update nama_observer dan nrp_pelapor dari observer_id
    IF NEW.observer_id IS NOT NULL THEN
        -- Note: users table uses 'nama', not 'name'
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

-- Backfill existing data
UPDATE planned_task_observation p
SET 
    nama_observer = u.nama,
    nrp_pelapor = u.nrp,
    jabatan_pelapor = u.jabatan
FROM users u
WHERE p.observer_id = u.id 
AND (p.nrp_pelapor IS NULL OR p.nrp_pelapor = '');
