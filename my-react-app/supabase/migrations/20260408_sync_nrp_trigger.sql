-- One-time sync untuk menyamakan NRP report lama dengan NRP di tabel users
UPDATE take_5 t
SET nrp = u.nrp
FROM users u
WHERE t.user_id = u.id 
  AND t.nrp IS DISTINCT FROM u.nrp 
  AND u.nrp IS NOT NULL;

UPDATE fit_to_work f
SET nrp = u.nrp
FROM users u
WHERE f.user_id = u.id 
  AND f.nrp IS DISTINCT FROM u.nrp 
  AND u.nrp IS NOT NULL;

UPDATE hazard_report h
SET pelapor_nrp = u.nrp
FROM users u
WHERE h.user_id = u.id 
  AND h.pelapor_nrp IS DISTINCT FROM u.nrp 
  AND u.nrp IS NOT NULL;

UPDATE planned_task_observation p
SET nrp_pelapor = u.nrp
FROM users u
WHERE p.observer_id = u.id 
  AND p.nrp_pelapor IS DISTINCT FROM u.nrp 
  AND u.nrp IS NOT NULL;

-- Function untuk mengotomatisasi perubahan NRP jika diganti di masa depan
CREATE OR REPLACE FUNCTION sync_user_nrp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.nrp IS DISTINCT FROM NEW.nrp THEN
    UPDATE take_5 SET nrp = NEW.nrp WHERE user_id = NEW.id;
    UPDATE fit_to_work SET nrp = NEW.nrp WHERE user_id = NEW.id;
    UPDATE hazard_report SET pelapor_nrp = NEW.nrp WHERE user_id = NEW.id;
    UPDATE planned_task_observation SET nrp_pelapor = NEW.nrp WHERE observer_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pada tabel users
DROP TRIGGER IF EXISTS trigger_sync_user_nrp ON users;
CREATE TRIGGER trigger_sync_user_nrp
AFTER UPDATE OF nrp ON users
FOR EACH ROW
EXECUTE FUNCTION sync_user_nrp();
