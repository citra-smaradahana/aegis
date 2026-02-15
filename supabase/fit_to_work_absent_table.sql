-- Tabel untuk menandai karyawan off/tidak hadir per tanggal
-- Validator dapat menandai user agar tidak wajib mengisi Fit To Work pada hari tersebut
-- Jalankan di Supabase SQL Editor SEBELUM menggunakan fitur Validasi Fit To Work yang baru

CREATE TABLE IF NOT EXISTS fit_to_work_absent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  marked_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tanggal)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_fit_to_work_absent_user_tanggal ON fit_to_work_absent(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_fit_to_work_absent_tanggal ON fit_to_work_absent(tanggal);

-- Enable RLS (Row Level Security)
ALTER TABLE fit_to_work_absent ENABLE ROW LEVEL SECURITY;

-- Policy: allow read/insert/update (drop dulu jika sudah ada, agar bisa dijalankan ulang)
DROP POLICY IF EXISTS "Allow read fit_to_work_absent" ON fit_to_work_absent;
DROP POLICY IF EXISTS "Allow insert fit_to_work_absent" ON fit_to_work_absent;
DROP POLICY IF EXISTS "Allow update fit_to_work_absent" ON fit_to_work_absent;

CREATE POLICY "Allow read fit_to_work_absent" ON fit_to_work_absent
  FOR SELECT USING (true);

CREATE POLICY "Allow insert fit_to_work_absent" ON fit_to_work_absent
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update fit_to_work_absent" ON fit_to_work_absent
  FOR UPDATE USING (true);

-- Opsional: Foreign key ke users jika tabel users ada
-- ALTER TABLE fit_to_work_absent ADD CONSTRAINT fk_fit_to_work_absent_user FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE fit_to_work_absent ADD CONSTRAINT fk_fit_to_work_absent_marked_by FOREIGN KEY (marked_by) REFERENCES users(id);
