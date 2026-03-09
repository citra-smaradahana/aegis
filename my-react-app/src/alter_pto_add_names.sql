-- SQL to alter planned_task_observation table and add name columns for easier querying
-- This addresses the user request to have nama_prosedur, nama_observee, and nama_observer_tambahan available directly

BEGIN;

-- 1. Add new columns if they don't exist
DO $$
BEGIN
    -- nama_observee
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'planned_task_observation'
        AND column_name = 'nama_observee'
    ) THEN
        ALTER TABLE planned_task_observation
        ADD COLUMN nama_observee VARCHAR(100);
    END IF;

    -- nama_observer_tambahan
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'planned_task_observation'
        AND column_name = 'nama_observer_tambahan'
    ) THEN
        ALTER TABLE planned_task_observation
        ADD COLUMN nama_observer_tambahan VARCHAR(100);
    END IF;

    -- nama_prosedur
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'planned_task_observation'
        AND column_name = 'nama_prosedur'
    ) THEN
        ALTER TABLE planned_task_observation
        ADD COLUMN nama_prosedur VARCHAR(255);
    END IF;
END $$;

-- 2. Update the existing trigger function `update_pto_user_info` to populate the new user name columns
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

-- 3. Create a new trigger function to populate nama_prosedur from master_prosedur
CREATE OR REPLACE FUNCTION update_pto_prosedur_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Populate nama_prosedur from master_prosedur based on prosedur_id
    IF NEW.prosedur_id IS NOT NULL THEN
        SELECT name INTO NEW.nama_prosedur
        FROM master_prosedur WHERE id = NEW.prosedur_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create trigger for prosedur name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.triggers
        WHERE event_object_table = 'planned_task_observation'
        AND trigger_name = 'update_pto_prosedur_name_trigger'
    ) THEN
        CREATE TRIGGER update_pto_prosedur_name_trigger
            BEFORE INSERT OR UPDATE ON planned_task_observation
            FOR EACH ROW
            EXECUTE FUNCTION update_pto_prosedur_name();
    END IF;
END $$;

-- 5. Backfill existing data (optional but recommended for consistency)
-- Update nama_observee
UPDATE planned_task_observation p
SET nama_observee = u.nama
FROM users u
WHERE p.observee_id = u.id AND p.nama_observee IS NULL;

-- Update nama_observer_tambahan
UPDATE planned_task_observation p
SET nama_observer_tambahan = u.nama
FROM users u
WHERE p.observer_tambahan_id = u.id AND p.nama_observer_tambahan IS NULL;

-- Update nama_prosedur
UPDATE planned_task_observation p
SET nama_prosedur = m.name
FROM master_prosedur m
WHERE p.prosedur_id = m.id AND p.nama_prosedur IS NULL;

COMMIT;
