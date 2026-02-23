-- ============================================================
-- Tabel safety_meetings: Laporan Harian (Daily Attendance Record)
-- Untuk menyimpan data laporan pertemuan yang akan dicetak ke PDF
-- Daftar hadir diambil dari User yang mengisi Fit To Work
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- Prasyarat: tabel users, fit_to_work, fit_to_work_attendance_summary sudah ada
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  site TEXT NOT NULL,
  meeting_type TEXT NOT NULL DEFAULT 'Briefing',
  time_start TEXT,
  time_end TEXT,
  duration INT DEFAULT 0,
  location TEXT,
  topic TEXT,
  department TEXT,
  area TEXT,
  agenda_items JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  attendance_list JSONB DEFAULT '[]',
  creator_id UUID,
  approver_id UUID,
  approver_name TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE safety_meetings IS 'Laporan harian pertemuan safety. attendance_list berisi data dari user yang mengisi Fit To Work.';
COMMENT ON COLUMN safety_meetings.attendance_list IS 'Array JSON: nama, jabatan, nrp, hari_masuk, sleep_today, sleep_48h dari user yang isi FTW';
COMMENT ON COLUMN safety_meetings.agenda_items IS 'Array JSON: { content, presenter, notes } per topik notulen';
COMMENT ON COLUMN safety_meetings.issues IS 'Array JSON: { content, submittedBy } masalah karyawan';
COMMENT ON COLUMN safety_meetings.actions IS 'Array JSON: { content, pic, due, status } tindakan perbaikan';

CREATE INDEX IF NOT EXISTS idx_safety_meetings_date ON safety_meetings(date);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_site ON safety_meetings(site);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_creator ON safety_meetings(creator_id);

ALTER TABLE safety_meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all safety_meetings" ON safety_meetings;
CREATE POLICY "Allow all safety_meetings" ON safety_meetings
  FOR ALL USING (true) WITH CHECK (true);
