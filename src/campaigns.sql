-- Tabel campaigns untuk berita/kampanye (judul, deskripsi, gambar)
-- Gambar disimpan di Storage bucket 'campaign-images', URL disimpan di image_url

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  deskripsi TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for campaigns" ON campaigns;
CREATE POLICY "Allow all for campaigns" ON campaigns
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE campaigns IS 'Kampanye/berita untuk ditampilkan di Home - Administrator input via menu Campaign';

-- ============================================================
-- STORAGE BUCKET: Buat bucket 'campaign-images' di Supabase Dashboard
-- 1. Buka Supabase Dashboard > Storage
-- 2. New bucket > nama: campaign-images
-- 3. Public bucket: ON (agar gambar bisa diakses)
-- 4. Create bucket
-- ============================================================
