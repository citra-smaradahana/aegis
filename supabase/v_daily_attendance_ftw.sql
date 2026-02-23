-- ============================================================
-- View: Daftar Hadir dari Fit To Work
-- Mengambil user yang sudah mengisi Fit To Work pada tanggal tertentu
-- Digunakan untuk mengisi formulir Laporan Harian (Daily Attendance Record)
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- Prasyarat: users, fit_to_work, fit_to_work_attendance_summary
-- ============================================================

-- View: Daftar user yang isi FTW per tanggal + site
-- Kolom: user_id, nama, jabatan, nrp, hari_masuk, sleep_today, sleep_48h, tidak_mengkonsumsi_obat, tidak_ada_masalah_pribadi, siap_bekerja
CREATE OR REPLACE VIEW v_daily_attendance_ftw AS
WITH ftw_today AS (
  SELECT
    f.nrp,
    f.site,
    f.tanggal,
    f.total_jam_tidur AS sleep_today,
    COALESCE(f.tidak_mengkonsumsi_obat, true) AS tidak_mengkonsumsi_obat,
    COALESCE(f.tidak_ada_masalah_pribadi, true) AS tidak_ada_masalah_pribadi,
    COALESCE(f.siap_bekerja, true) AS siap_bekerja
  FROM fit_to_work f
  WHERE f.tanggal IS NOT NULL
),
ftw_yesterday AS (
  SELECT
    f.nrp,
    f.site,
    f.tanggal,
    f.total_jam_tidur AS sleep_yesterday
  FROM fit_to_work f
  WHERE f.tanggal IS NOT NULL
),
combined AS (
  SELECT
    u.id AS user_id,
    u.nama,
    u.jabatan,
    u.nrp,
    u.site,
    t.tanggal,
    COALESCE(a.current_hari_masuk, 0) AS hari_masuk,
    COALESCE(t.sleep_today::numeric, 0) AS sleep_today,
    COALESCE(y.sleep_yesterday::numeric, 0) AS sleep_yesterday,
    COALESCE(t.sleep_today::numeric, 0) + COALESCE(y.sleep_yesterday::numeric, 0) AS sleep_48h,
    t.tidak_mengkonsumsi_obat,
    t.tidak_ada_masalah_pribadi,
    t.siap_bekerja
  FROM users u
  INNER JOIN ftw_today t ON u.nrp = t.nrp AND u.site = t.site
  LEFT JOIN fit_to_work_attendance_summary a ON u.id = a.user_id
  LEFT JOIN ftw_yesterday y ON u.nrp = y.nrp
    AND u.site = y.site
    AND y.tanggal = t.tanggal - 1
)
SELECT
  user_id,
  nama,
  jabatan,
  nrp,
  site,
  tanggal,
  hari_masuk,
  sleep_today,
  sleep_48h,
  tidak_mengkonsumsi_obat,
  tidak_ada_masalah_pribadi,
  siap_bekerja
FROM combined;

COMMENT ON VIEW v_daily_attendance_ftw IS 'Daftar hadir: user yang sudah isi Fit To Work. Filter: tanggal, site.';

-- ============================================================
-- Fungsi: Ambil daftar hadir untuk tanggal + site tertentu
-- ============================================================
-- Drop dulu jika return type berubah (PostgreSQL tidak bisa CREATE OR REPLACE dengan return type berbeda)
DROP FUNCTION IF EXISTS get_daily_attendance_ftw(DATE, TEXT);

CREATE OR REPLACE FUNCTION get_daily_attendance_ftw(
  p_tanggal DATE,
  p_site TEXT
)
RETURNS TABLE (
  user_id UUID,
  nama TEXT,
  jabatan TEXT,
  nrp TEXT,
  hari_masuk INT,
  sleep_today NUMERIC,
  sleep_48h NUMERIC,
  tidak_mengkonsumsi_obat BOOLEAN,
  tidak_ada_masalah_pribadi BOOLEAN,
  siap_bekerja BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.user_id,
    v.nama,
    v.jabatan,
    v.nrp,
    v.hari_masuk::INT,
    v.sleep_today,
    v.sleep_48h,
    v.tidak_mengkonsumsi_obat,
    v.tidak_ada_masalah_pribadi,
    v.siap_bekerja
  FROM v_daily_attendance_ftw v
  WHERE v.tanggal = p_tanggal
    AND v.site = p_site
  ORDER BY v.hari_masuk DESC, v.nama;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_daily_attendance_ftw IS 'Ambil daftar hadir (user yang isi FTW) untuk tanggal dan site. Contoh: SELECT * FROM get_daily_attendance_ftw(CURRENT_DATE, ''BSIB'');';
