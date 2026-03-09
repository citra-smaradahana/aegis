-- Pengaturan Fit To Work per Site
-- Toggle ON = site wajib Fit To Work
-- Toggle OFF = site tidak wajib (user tetap boleh mengisi secara opsional)
-- Jalankan di Supabase SQL Editor

ALTER TABLE master_sites 
ADD COLUMN IF NOT EXISTS fit_to_work_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN master_sites.fit_to_work_enabled IS 'Jika true, user di site ini wajib mengisi Fit To Work. Jika false, tidak wajib tetapi tetap boleh mengisi.';
