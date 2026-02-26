-- Tabel Daily Attendance Report (Safety Meetings / Laporan Harian)
-- Menyimpan data pertemuan: P5M, Safety Talk, Briefing, Rapat, dll.
-- Termasuk kolom agenda/tema (Agenda / Tema).
-- Jalankan di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS safety_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  site TEXT NOT NULL,
  meeting_type TEXT,
  time_start TEXT,
  time_end TEXT,
  duration INTEGER DEFAULT 0,
  location TEXT,
  topic TEXT,
  agenda TEXT,
  department TEXT,
  area TEXT,
  agenda_items JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  attendance_list JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  lampiran_di_halaman_berikutnya BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES users(id),
  approver_id UUID REFERENCES users(id),
  approver_name TEXT,
  status TEXT DEFAULT 'Pending'
);

-- agenda: Agenda / Tema (contoh: Safety Briefing Shift Pagi, Pembahasan K3)
-- agenda_items: array of { content, presenter, attachment, notes }
-- attendance_list: array of { user_id, nama, nrp, jabatan, hadir, dll }
-- images: array of URL string

CREATE INDEX IF NOT EXISTS idx_safety_meetings_site ON safety_meetings(site);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_date ON safety_meetings(date);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_creator ON safety_meetings(creator_id);
CREATE INDEX IF NOT EXISTS idx_safety_meetings_status ON safety_meetings(status);

COMMENT ON TABLE safety_meetings IS 'Laporan Harian / Daily Attendance Report - P5M, Safety Talk, Briefing, Rapat';
COMMENT ON COLUMN safety_meetings.agenda IS 'Agenda / Tema pertemuan';

-- Jika tabel safety_meetings sudah ada tetapi belum punya kolom agenda/tema, jalankan saja:
-- ALTER TABLE safety_meetings ADD COLUMN IF NOT EXISTS agenda TEXT;
-- ALTER TABLE safety_meetings ADD COLUMN IF NOT EXISTS topic TEXT;
