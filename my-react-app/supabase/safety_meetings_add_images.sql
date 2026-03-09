-- Tambah kolom images ke safety_meetings untuk lampiran gambar
-- Jalankan di Supabase SQL Editor

ALTER TABLE safety_meetings ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';

COMMENT ON COLUMN safety_meetings.images IS 'Array URL gambar lampiran (dari Supabase Storage)';
