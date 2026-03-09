-- ============================================================
-- Tambah kolom initial_status_fatigue pada tabel fit_to_work
-- Kolom ini menyimpan status saat pengisian pertama (sebelum validasi)
-- agar dashboard bisa menampilkan tren: awalnya Not Fit -> jadi Fit
-- ============================================================

-- 1. Tambah kolom (boleh NULL untuk data lama)
ALTER TABLE fit_to_work
ADD COLUMN IF NOT EXISTS initial_status_fatigue TEXT;

-- 2. Isi data lama: set initial = status saat ini (satu kali jalan)
UPDATE fit_to_work
SET initial_status_fatigue = COALESCE(status_fatigue, status, 'Fit To Work')
WHERE initial_status_fatigue IS NULL;

-- 3. (Opsional) Tambah komentar kolom
COMMENT ON COLUMN fit_to_work.initial_status_fatigue IS 'Status fatigue saat pengisian pertama (sebelum validasi). Tidak diubah saat validasi. Nilai: Fit To Work | Not Fit To Work';
