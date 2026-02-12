-- =====================================================
-- FIX PIC STRUCTURE V2 - ADD SEPARATE PIC COLUMN
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Add new PIC column to store name
ALTER TABLE planned_task_observation 
ADD COLUMN IF NOT EXISTS pic VARCHAR(255);

-- 2. Update existing data to populate PIC column
-- First, let's see what we have
SELECT 
    id,
    pic_tindak_lanjut_id,
    nrp_pic,
    pic
FROM planned_task_observation 
WHERE status = 'pending';

-- 3. Update trigger function to auto-fill PIC name from pic_tindak_lanjut_id
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
    
    -- Update PIC name dari pic_tindak_lanjut_id
    IF NEW.pic_tindak_lanjut_id IS NOT NULL THEN
        SELECT nama INTO NEW.pic
        FROM users WHERE id = NEW.pic_tindak_lanjut_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'planned_task_observation' 
AND column_name IN ('pic_tindak_lanjut_id', 'pic', 'nrp_pic')
ORDER BY ordinal_position;

-- 5. Test the trigger by updating existing records
UPDATE planned_task_observation 
SET pic_tindak_lanjut_id = pic_tindak_lanjut_id 
WHERE status = 'pending' AND pic_tindak_lanjut_id IS NOT NULL;

-- 6. Show final result
SELECT 
    id,
    nama_observer,
    site,
    pic_tindak_lanjut_id,
    pic,
    nrp_pic,
    status
FROM planned_task_observation 
WHERE status = 'pending'
ORDER BY created_at DESC;
