-- ============================================================
-- INSPEKSI 5R — Schema Supabase
-- Dokumen referensi: BSI-OHS-FO-180 (Office), BSI-OHS-FO-179 (Non-Office)
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- Prasyarat: tabel public.users sudah ada
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABEL UTAMA: inspeksi_5r
--    Menyimpan header setiap sesi inspeksi 5R
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspeksi_5r (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identitas Inspeksi (dari form header)
  area_type       TEXT NOT NULL CHECK (area_type IN ('office', 'non-office')),
  doc_ref         TEXT,                       -- BSI-OHS-FO-180 / BSI-OHS-FO-179
  tanggal         DATE NOT NULL DEFAULT CURRENT_DATE,
  work_area       TEXT NOT NULL,              -- Work Area (wajib)
  leader_name     TEXT,                       -- 5S Leader
  inspector_name  TEXT,                       -- 5R / 5S Inspector

  -- Site & User
  site            TEXT,                       -- Diambil dari user.site
  submitted_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_by_nama TEXT,                     -- Snapshot nama inspector saat submit

  -- Ringkasan Hasil
  total_items     INT DEFAULT 0,
  total_ok        INT DEFAULT 0,
  total_nok       INT DEFAULT 0,
  total_na        INT DEFAULT 0,
  score_pct       NUMERIC(5,2),               -- Persentase OK dari total berlaku (bukan N/A)

  -- Status
  status          TEXT DEFAULT 'submitted'
                  CHECK (status IN ('draft', 'submitted')),

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.inspeksi_5r IS
  'Header sesi inspeksi 5R. Setiap baris mewakili satu form inspeksi yang dikirim.';
COMMENT ON COLUMN public.inspeksi_5r.area_type IS
  'Jenis area: office (BSI-OHS-FO-180) atau non-office (BSI-OHS-FO-179)';
COMMENT ON COLUMN public.inspeksi_5r.score_pct IS
  'Skor = (jumlah OK) / (total_items - total_na) * 100';


-- ────────────────────────────────────────────────────────────
-- 2. TABEL JAWABAN: inspeksi_5r_items
--    Menyimpan jawaban (OK/NOK/NA) per item checklist
--    beserta URL foto temuan jika NOK
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspeksi_5r_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspeksi_id     UUID NOT NULL REFERENCES public.inspeksi_5r(id) ON DELETE CASCADE,

  -- Identifikasi item
  kategori_kode   TEXT NOT NULL,              -- S1, S2, S3, S4, S5
  item_index      INT  NOT NULL,              -- Index 0-based dalam kategori
  item_text       TEXT NOT NULL,              -- Teks pertanyaan (snapshot)

  -- Jawaban
  score           TEXT NOT NULL
                  CHECK (score IN ('ok', 'nok', 'na')),

  -- Foto temuan (wajib jika score = 'nok')
  foto_url        TEXT,                       -- Public URL dari storage bucket

  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE (inspeksi_id, kategori_kode, item_index)
);

COMMENT ON TABLE public.inspeksi_5r_items IS
  'Jawaban per item checklist per sesi inspeksi. Item NOK wajib memiliki foto_url.';
COMMENT ON COLUMN public.inspeksi_5r_items.foto_url IS
  'URL gambar temuan dari bucket inspeksi-5r-foto. Wajib ada jika score = nok.';


-- ────────────────────────────────────────────────────────────
-- 3. TABEL CATATAN: inspeksi_5r_catatan
--    Menyimpan catatan per kategori (S1–S5)
--    akan digabung menjadi satu Comments di cetak PDF
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inspeksi_5r_catatan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspeksi_id     UUID NOT NULL REFERENCES public.inspeksi_5r(id) ON DELETE CASCADE,

  kategori_kode   TEXT NOT NULL,              -- S1, S2, S3, S4, S5
  catatan         TEXT NOT NULL DEFAULT '',

  UNIQUE (inspeksi_id, kategori_kode)
);

COMMENT ON TABLE public.inspeksi_5r_catatan IS
  'Catatan bebas per kategori. Saat cetak PDF, semua catatan digabung menjadi satu blok Comments.';


-- ────────────────────────────────────────────────────────────
-- 4. INDEX
-- ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_tanggal
  ON public.inspeksi_5r(tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_site
  ON public.inspeksi_5r(site);

CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_area
  ON public.inspeksi_5r(area_type);

CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_submitted_by
  ON public.inspeksi_5r(submitted_by);

CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_items_inspeksi
  ON public.inspeksi_5r_items(inspeksi_id);

CREATE INDEX IF NOT EXISTS idx_inspeksi_5r_catatan_inspeksi
  ON public.inspeksi_5r_catatan(inspeksi_id);


-- ────────────────────────────────────────────────────────────
-- 5. TRIGGER: updated_at otomatis
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspeksi_5r_updated_at ON public.inspeksi_5r;
CREATE TRIGGER trg_inspeksi_5r_updated_at
  BEFORE UPDATE ON public.inspeksi_5r
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.inspeksi_5r         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspeksi_5r_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspeksi_5r_catatan ENABLE ROW LEVEL SECURITY;

-- Izinkan semua operasi (sesuai pola aplikasi ini)
DROP POLICY IF EXISTS "Allow all inspeksi_5r"         ON public.inspeksi_5r;
DROP POLICY IF EXISTS "Allow all inspeksi_5r_items"   ON public.inspeksi_5r_items;
DROP POLICY IF EXISTS "Allow all inspeksi_5r_catatan" ON public.inspeksi_5r_catatan;

CREATE POLICY "Allow all inspeksi_5r"
  ON public.inspeksi_5r FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all inspeksi_5r_items"
  ON public.inspeksi_5r_items FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all inspeksi_5r_catatan"
  ON public.inspeksi_5r_catatan FOR ALL USING (true) WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET: inspeksi-5r-foto
--    Untuk menyimpan foto temuan item NOK
-- ────────────────────────────────────────────────────────────
-- Jalankan di SQL Editor (Supabase Storage API via SQL)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspeksi-5r-foto',
  'inspeksi-5r-foto',
  true,                                       -- Public agar URL langsung bisa diakses di PDF / preview
  5242880,                                    -- Max 5 MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policy: izinkan upload, read, dan delete oleh semua user (termasuk anon karena app pakai login kustom)
DROP POLICY IF EXISTS "Allow upload inspeksi-5r-foto" ON storage.objects;
DROP POLICY IF EXISTS "Allow read inspeksi-5r-foto"   ON storage.objects;
DROP POLICY IF EXISTS "Allow delete inspeksi-5r-foto" ON storage.objects;

CREATE POLICY "Allow upload inspeksi-5r-foto"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'inspeksi-5r-foto');

CREATE POLICY "Allow read inspeksi-5r-foto"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspeksi-5r-foto');

CREATE POLICY "Allow delete inspeksi-5r-foto"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'inspeksi-5r-foto');


-- ────────────────────────────────────────────────────────────
-- 8. VIEW RINGKASAN (opsional, berguna untuk dashboard)
--    v_inspeksi_5r_summary: satu baris per inspeksi dengan
--    ringkasan catatan yang sudah digabung (untuk cetak PDF)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_inspeksi_5r_summary AS
SELECT
  h.id,
  h.area_type,
  h.doc_ref,
  h.tanggal,
  h.work_area,
  h.leader_name,
  h.inspector_name,
  h.site,
  h.submitted_by,
  h.submitted_by_nama,
  h.total_items,
  h.total_ok,
  h.total_nok,
  h.total_na,
  h.score_pct,
  h.status,
  h.created_at,
  -- Gabungkan catatan semua kategori untuk bagian Comments di cetak PDF
  STRING_AGG(
    CASE WHEN c.catatan IS NOT NULL AND c.catatan <> ''
         THEN '[' || c.kategori_kode || '] ' || c.catatan
         ELSE NULL
    END,
    E'\n' ORDER BY c.kategori_kode
  ) AS comments_gabungan
FROM public.inspeksi_5r h
LEFT JOIN public.inspeksi_5r_catatan c ON c.inspeksi_id = h.id
GROUP BY h.id;

COMMENT ON VIEW public.v_inspeksi_5r_summary IS
  'View ringkasan per inspeksi. Kolom comments_gabungan berisi semua catatan kategori yang digabung, siap untuk cetak PDF.';
