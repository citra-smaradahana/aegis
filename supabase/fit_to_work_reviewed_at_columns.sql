-- ============================================================
-- Tambah kolom reviewed_tahap1_at dan reviewed_tahap2_at pada tabel fit_to_work
-- Untuk menyimpan jam validasi tahap 1 dan tahap 2
-- ============================================================

ALTER TABLE fit_to_work
ADD COLUMN IF NOT EXISTS reviewed_tahap1_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_tahap2_at TIMESTAMPTZ;

COMMENT ON COLUMN fit_to_work.reviewed_tahap1_at IS 'Waktu validasi tahap 1 (Level 1 Review)';
COMMENT ON COLUMN fit_to_work.reviewed_tahap2_at IS 'Waktu validasi tahap 2 (Level 2 Review / Closed)';
