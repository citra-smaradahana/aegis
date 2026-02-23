-- Tabel Pengaturan Menu (Akses per Jabatan, per Site, Override per User)
-- Jalankan di Supabase SQL Editor SETELAH master_data_tables.sql

-- 1. Menu default per Jabatan
CREATE TABLE IF NOT EXISTS master_jabatan_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jabatan_id UUID NOT NULL REFERENCES master_jabatan(id) ON DELETE CASCADE,
  menu_key TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(jabatan_id, menu_key)
);

-- 2. Menu yang tersedia per Site (filter: user hanya lihat menu yang enabled di site-nya)
CREATE TABLE IF NOT EXISTS master_site_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES master_sites(id) ON DELETE CASCADE,
  menu_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, menu_key)
);

-- 3. Override per User (menu tambahan di luar default jabatan)
CREATE TABLE IF NOT EXISTS user_menu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  menu_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, menu_key)
);

-- RLS
ALTER TABLE master_jabatan_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_site_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all master_jabatan_menu" ON master_jabatan_menu;
CREATE POLICY "Allow all master_jabatan_menu" ON master_jabatan_menu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all master_site_menu" ON master_site_menu;
CREATE POLICY "Allow all master_site_menu" ON master_site_menu FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all user_menu" ON user_menu;
CREATE POLICY "Allow all user_menu" ON user_menu FOR ALL USING (true) WITH CHECK (true);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_master_jabatan_menu_jabatan ON master_jabatan_menu(jabatan_id);
CREATE INDEX IF NOT EXISTS idx_master_site_menu_site ON master_site_menu(site_id);
CREATE INDEX IF NOT EXISTS idx_user_menu_user ON user_menu(user_id);
