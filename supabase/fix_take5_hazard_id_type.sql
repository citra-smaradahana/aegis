-- Fix: column "hazard_id" is of type uuid but expression is of type bigint
-- Jalankan SELURUH file ini di Supabase SQL Editor
--
-- PENYEBAB: hazard_report.id bertipe bigint, take_5.hazard_id bertipe uuid
-- SOLUSI: Ubah take_5.hazard_id ke BIGINT agar bisa diisi dari hazard_report.id

-- 1. Drop trigger lama (jika masih ada)
DROP TRIGGER IF EXISTS update_take5_hazard_id_trigger ON hazard_report;

-- 2. Ubah tipe kolom hazard_id: UUID -> BIGINT
ALTER TABLE take_5 DROP CONSTRAINT IF EXISTS take_5_hazard_id_fkey;
ALTER TABLE take_5 ALTER COLUMN hazard_id TYPE BIGINT USING (NULL::bigint);
-- Opsional: tambah FK jika hazard_report(id) ada
-- ALTER TABLE take_5 ADD CONSTRAINT take_5_hazard_id_fkey FOREIGN KEY (hazard_id) REFERENCES hazard_report(id);

-- 3. Re-create trigger untuk set hazard_id ketika hazard report dibuat dari Take 5
CREATE OR REPLACE FUNCTION update_take5_hazard_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.take_5_id IS NOT NULL THEN
        UPDATE take_5 SET hazard_id = NEW.id WHERE id = NEW.take_5_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_take5_hazard_id_trigger
    AFTER INSERT ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_take5_hazard_id();

-- 4. Fungsi update status Take 5 saat hazard closed
CREATE OR REPLACE FUNCTION update_take5_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' AND NEW.take_5_id IS NOT NULL THEN
        UPDATE take_5 SET status = 'closed' WHERE id = NEW.take_5_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
