-- Tambahkan kolom q5 ke tabel take_5
ALTER TABLE IF EXISTS public.take_5
ADD COLUMN IF NOT EXISTS q5 BOOLEAN;

-- (Opsional) Berikan komentar pada kolom untuk dokumentasi
COMMENT ON COLUMN public.take_5.q5 IS 'Pertanyaan 5: Apakah saya memiliki APD yang benar untuk melakukan pekerjaan ini?';

-- Catatan:
-- q1: Apakah saya sehat secara fisik untuk melakukan pekerjaan ini?
-- q2: Apakah saya mengerti pekerjaan yang akan saya lakukan, memahami langkah pekerjaan yang benar?
-- q3: Apakah saya mengerti potensi bahaya yang akan terjadi saat melakukan pekerjaan yang benar?
-- q4: Apakah saya memiliki peralatan yang benar untuk melakukan pekerjaan ini?
-- q5: Apakah saya memiliki APD yang benar untuk melakukan pekerjaan ini?
