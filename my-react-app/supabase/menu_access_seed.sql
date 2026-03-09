-- Seed default menu per jabatan (opsional - jalankan SETELAH menu_access_tables.sql)
-- Default: user biasa (Mekanik, Crew, dll) = FTW, Take 5, Hazard
-- Default: supervisor (PJO, SHERQ, dll) = semua menu

INSERT INTO master_jabatan_menu (jabatan_id, menu_key, sort_order)
SELECT j.id, m.key, m.ord
FROM master_jabatan j
CROSS JOIN (VALUES
  ('fit-to-work', 0),
  ('fit-to-work-validation', 1),
  ('daily-attendance', 2),
  ('take-5', 3),
  ('hazard', 4),
  ('pto', 5)
) AS m(key, ord)
WHERE j.name IN (
  'Administrator', 'Admin Site Project', 'SHERQ Officer', 'Field Leading Hand',
  'Plant Leading Hand', 'Technical Service', 'Asst. Penanggung Jawab Operasional',
  'Penanggung Jawab Operasional', 'SHE'
)
ON CONFLICT (jabatan_id, menu_key) DO NOTHING;

INSERT INTO master_jabatan_menu (jabatan_id, menu_key, sort_order)
SELECT j.id, m.key, m.ord
FROM master_jabatan j
CROSS JOIN (VALUES
  ('fit-to-work', 0),
  ('take-5', 1),
  ('hazard', 2)
) AS m(key, ord)
WHERE j.name NOT IN (
  'Administrator', 'Admin Site Project', 'SHERQ Officer', 'Field Leading Hand',
  'Plant Leading Hand', 'Technical Service', 'Asst. Penanggung Jawab Operasional',
  'Penanggung Jawab Operasional', 'SHE'
)
ON CONFLICT (jabatan_id, menu_key) DO NOTHING;
