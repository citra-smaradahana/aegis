-- Master Data Tables untuk Pengaturan Administrator
-- Jalankan di Supabase SQL Editor

-- 1. Sites
CREATE TABLE IF NOT EXISTS master_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  fit_to_work_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Site Locations (detail lokasi per site)
CREATE TABLE IF NOT EXISTS master_site_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES master_sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, name)
);

-- 3. Ketidaksesuaian (kategori utama Hazard)
CREATE TABLE IF NOT EXISTS master_ketidaksesuaian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sub Ketidaksesuaian (per ketidaksesuaian)
CREATE TABLE IF NOT EXISTS master_sub_ketidaksesuaian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ketidaksesuaian_id UUID NOT NULL REFERENCES master_ketidaksesuaian(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ketidaksesuaian_id, name)
);

-- 5. Prosedur (PTO)
CREATE TABLE IF NOT EXISTS master_prosedur (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Jabatan
CREATE TABLE IF NOT EXISTS master_jabatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Alasan Observasi (PTO)
CREATE TABLE IF NOT EXISTS master_alasan_observasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS and Policies
ALTER TABLE master_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_site_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_ketidaksesuaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_sub_ketidaksesuaian ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prosedur ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_jabatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_alasan_observasi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all master_sites" ON master_sites;
CREATE POLICY "Allow all master_sites" ON master_sites FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_site_locations" ON master_site_locations;
CREATE POLICY "Allow all master_site_locations" ON master_site_locations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_ketidaksesuaian" ON master_ketidaksesuaian;
CREATE POLICY "Allow all master_ketidaksesuaian" ON master_ketidaksesuaian FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_sub_ketidaksesuaian" ON master_sub_ketidaksesuaian;
CREATE POLICY "Allow all master_sub_ketidaksesuaian" ON master_sub_ketidaksesuaian FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_prosedur" ON master_prosedur;
CREATE POLICY "Allow all master_prosedur" ON master_prosedur FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_jabatan" ON master_jabatan;
CREATE POLICY "Allow all master_jabatan" ON master_jabatan FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_alasan_observasi" ON master_alasan_observasi;
CREATE POLICY "Allow all master_alasan_observasi" ON master_alasan_observasi FOR ALL USING (true) WITH CHECK (true);
