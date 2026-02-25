-- Tambah kolom lampiran_di_halaman_berikutnya ke safety_meetings
-- Jika dicentang saat simpan, gambar lampiran akan dicetak di halaman terpisah (pageBreakBefore)
-- Jalankan di Supabase SQL Editor

ALTER TABLE safety_meetings ADD COLUMN IF NOT EXISTS lampiran_di_halaman_berikutnya BOOLEAN DEFAULT false;

COMMENT ON COLUMN safety_meetings.lampiran_di_halaman_berikutnya IS 'Jika true, lampiran gambar dicetak di halaman berikutnya (bukan di bawah tanda tangan)';
