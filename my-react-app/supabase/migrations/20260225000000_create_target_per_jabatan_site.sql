-- Tabel target per jabatan per site (untuk Hazard, Take 5, PTO)
-- Target diberikan per bulan
CREATE TABLE IF NOT EXISTS target_per_jabatan_site (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL CHECK (module IN ('hazard', 'take_5', 'pto')),
  site TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  target_per_bulan INTEGER NOT NULL DEFAULT 0 CHECK (target_per_bulan >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, site, jabatan)
);

-- Index untuk query cepat
CREATE INDEX IF NOT EXISTS idx_target_per_jabatan_site_module_site 
  ON target_per_jabatan_site(module, site);

-- RLS: akses dikontrol di level aplikasi (evaluator/admin)
ALTER TABLE target_per_jabatan_site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all"
  ON target_per_jabatan_site FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_target_per_jabatan_site_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_target_per_jabatan_site_updated_at
  BEFORE UPDATE ON target_per_jabatan_site
  FOR EACH ROW
  EXECUTE FUNCTION update_target_per_jabatan_site_updated_at();
