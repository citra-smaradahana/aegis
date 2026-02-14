-- Fix: column "hazard_id" is of type uuid but expression is of type bigint
-- Jalankan SELURUH file ini di Supabase SQL Editor
--
-- PENYEBAB: Trigger update_take5_hazard_id mencoba set take_5.hazard_id = hazard_report.id
-- Tapi tipe tidak cocok (uuid vs bigint) - kemungkinan hazard_report.id pakai bigint
--
-- SOLUSI: 
-- 1. Nonaktifkan trigger yang bermasalah
-- 2. Update fungsi update_take5_status_from_hazard agar gunakan take_5_id (bukan hazard_id)

-- 1. Drop trigger yang menyebabkan error
DROP TRIGGER IF EXISTS update_take5_hazard_id_trigger ON hazard_report;

-- 2. Update fungsi agar saat hazard "closed", Take 5 diupdate via take_5_id (bukan hazard_id)
CREATE OR REPLACE FUNCTION update_take5_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'closed' THEN
        -- Update via take_5_id (tersedia dari hazard_report)
        IF NEW.take_5_id IS NOT NULL THEN
            UPDATE take_5 SET status = 'closed' WHERE id = NEW.take_5_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verifikasi: trigger bermasalah seharusnya sudah tidak ada
-- SELECT * FROM pg_trigger WHERE tgname = 'update_take5_hazard_id_trigger';
-- Hasil harus 0 rows
