-- Policy untuk menghapus record fit_to_work_absent (Tandai On / Hadir - revisi oleh PJO, Asst PJO, SHERQ)
-- Jalankan di Supabase SQL Editor setelah fit_to_work_absent_table.sql

DROP POLICY IF EXISTS "Allow delete fit_to_work_absent" ON fit_to_work_absent;

CREATE POLICY "Allow delete fit_to_work_absent" ON fit_to_work_absent
  FOR DELETE USING (true);
