-- Ringkasan hari masuk Fit To Work per user
-- Jalankan di Supabase SQL Editor sebelum fitur hari masuk dipakai

CREATE TABLE IF NOT EXISTS fit_to_work_attendance_summary (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  site TEXT NOT NULL,
  current_hari_masuk INT NOT NULL DEFAULT 0 CHECK (current_hari_masuk >= 0),
  last_ftw_date DATE,
  last_reset_at TIMESTAMPTZ,
  last_reset_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ftw_attendance_summary_site
  ON fit_to_work_attendance_summary(site);

CREATE INDEX IF NOT EXISTS idx_ftw_attendance_summary_hari_masuk
  ON fit_to_work_attendance_summary(current_hari_masuk);

ALTER TABLE fit_to_work_attendance_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all fit_to_work_attendance_summary" ON fit_to_work_attendance_summary;
CREATE POLICY "Allow all fit_to_work_attendance_summary" ON fit_to_work_attendance_summary
  FOR ALL USING (true) WITH CHECK (true);
