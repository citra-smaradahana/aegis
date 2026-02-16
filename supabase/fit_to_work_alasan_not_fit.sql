-- ============================================================
-- Tambah kolom alasan_not_fit_user pada tabel fit_to_work
-- Alasan dari user kenapa menjadi Not Fit To Work saat pengisian
-- Ditampilkan di halaman validasi untuk referensi validator
-- ============================================================

ALTER TABLE fit_to_work
ADD COLUMN IF NOT EXISTS alasan_not_fit_user TEXT;

COMMENT ON COLUMN fit_to_work.alasan_not_fit_user IS 'Alasan dari user kenapa status menjadi Not Fit To Work saat pengisian (diisi oleh user saat input)';
