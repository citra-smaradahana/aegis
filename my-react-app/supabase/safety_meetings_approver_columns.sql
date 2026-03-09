-- ============================================================
-- Tambah kolom approver ke safety_meetings
-- Untuk Approval (Mengetahui) - PJO / Asst PJO
-- ============================================================
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE safety_meetings
  ADD COLUMN IF NOT EXISTS approver_id UUID,
  ADD COLUMN IF NOT EXISTS approver_name TEXT;

COMMENT ON COLUMN safety_meetings.approver_id IS 'User ID PJO atau Asst PJO yang menyetujui';
COMMENT ON COLUMN safety_meetings.approver_name IS 'Nama approver untuk kolom Mengetahui';
