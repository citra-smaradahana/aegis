-- SQL to update PTO table with human-readable names
-- Run this script in your Supabase SQL Editor

-- 1. Add columns for storing readable names
ALTER TABLE planned_task_observation 
ADD COLUMN IF NOT EXISTS nama_prosedur_departemen VARCHAR(255),
ADD COLUMN IF NOT EXISTS nama_prosedur VARCHAR(255),
ADD COLUMN IF NOT EXISTS nama_observer VARCHAR(100),
ADD COLUMN IF NOT EXISTS nama_observee VARCHAR(100),
ADD COLUMN IF NOT EXISTS nama_pic VARCHAR(100);

-- 2. Create a function to automatically populate these names from IDs
CREATE OR REPLACE FUNCTION populate_pto_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Get Prosedur Departemen Name
    IF NEW.prosedur_departemen_id IS NOT NULL THEN
        SELECT name INTO NEW.nama_prosedur_departemen 
        FROM master_prosedur_departemen 
        WHERE id = NEW.prosedur_departemen_id;
    END IF;

    -- Get Prosedur Name
    IF NEW.prosedur_id IS NOT NULL THEN
        SELECT name INTO NEW.nama_prosedur 
        FROM master_prosedur 
        WHERE id = NEW.prosedur_id;
    END IF;

    -- Get Observer Name
    IF NEW.observer_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_observer 
        FROM users 
        WHERE id = NEW.observer_id;
    END IF;

    -- Get Observee Name
    IF NEW.observee_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_observee 
        FROM users 
        WHERE id = NEW.observee_id;
    END IF;

    -- Get PIC Name
    IF NEW.pic_tindak_lanjut_id IS NOT NULL THEN
        SELECT nama INTO NEW.nama_pic 
        FROM users 
        WHERE id = NEW.pic_tindak_lanjut_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to run this function before every INSERT or UPDATE
DROP TRIGGER IF EXISTS trigger_populate_pto_names ON planned_task_observation;

CREATE TRIGGER trigger_populate_pto_names
BEFORE INSERT OR UPDATE ON planned_task_observation
FOR EACH ROW
EXECUTE FUNCTION populate_pto_names();

-- 4. Update existing rows to fill in the missing names
UPDATE planned_task_observation SET id = id; 
-- (This dummy update triggers the function for all existing rows)
