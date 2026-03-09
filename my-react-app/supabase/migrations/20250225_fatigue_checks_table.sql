-- Tabel Fatigue Check Report
-- Leading Hand mengisi pengecekan kelelahan untuk subordinate
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS fatigue_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  shift TEXT,
  site TEXT NOT NULL,
  location TEXT,
  inspector_id UUID REFERENCES users(id),
  inspector_name TEXT,
  inspector_jabatan TEXT,
  checks JSONB DEFAULT '[]',
  status TEXT DEFAULT 'Pending',
  approver_id UUID REFERENCES users(id),
  approver_name TEXT,
  approver_jabatan TEXT
);

-- checks: array of {
--   user_id, nama, nrp, jabatan, hari_kerja, jam_tidur,
--   jam_periksa, soberity_1, soberity_2, soberity_3, soberity_4,
--   kontak_radio, kontak_tatap_muka, tekanan_darah, fit, unfit,
--   mess_luar_mess, tindakan_unfit
-- }

CREATE INDEX IF NOT EXISTS idx_fatigue_checks_site ON fatigue_checks(site);
CREATE INDEX IF NOT EXISTS idx_fatigue_checks_date ON fatigue_checks(date);
CREATE INDEX IF NOT EXISTS idx_fatigue_checks_inspector ON fatigue_checks(inspector_id);

COMMENT ON TABLE fatigue_checks IS 'Formulir Pemeriksaan Kelelahan (Fatigue Check) - diisi Leading Hand';
