-- SQL untuk update tabel hazard_report agar mendukung PTO
-- Menambahkan kolom untuk tracking sumber laporan (Take 5 atau PTO)

-- Tambah kolom sumber_laporan dan id_sumber_laporan ke tabel hazard_report
ALTER TABLE hazard_report 
ADD COLUMN IF NOT EXISTS sumber_laporan VARCHAR(10) CHECK (sumber_laporan IN ('Take5', 'PTO')),
ADD COLUMN IF NOT EXISTS id_sumber_laporan UUID;

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_hazard_sumber_laporan ON hazard_report(sumber_laporan, id_sumber_laporan);

-- Update existing Take 5 hazard reports untuk set sumber_laporan = 'Take5'
-- (jika ada data existing yang perlu diupdate)
UPDATE hazard_report 
SET sumber_laporan = 'Take5' 
WHERE sumber_laporan IS NULL 
AND id IN (
    SELECT DISTINCT h.id 
    FROM hazard_report h 
    INNER JOIN take5 t ON h.tanggal = t.tanggal 
    AND h.site = t.site 
    AND h.detail_lokasi = t.detail_lokasi
);

-- Function untuk mendapatkan PTO pending untuk dropdown hazard report
CREATE OR REPLACE FUNCTION get_pending_reports_for_hazard()
RETURNS TABLE (
    id UUID,
    sumber_laporan VARCHAR(10),
    nama_pelapor VARCHAR(100),
    tanggal DATE,
    detail_lokasi VARCHAR(100),
    deskripsi TEXT
) AS $$
BEGIN
    -- Return PTO pending
    RETURN QUERY
    SELECT 
        p.id,
        'PTO'::VARCHAR(10) as sumber_laporan,
        p.nama_observer as nama_pelapor,
        p.tanggal,
        p.detail_lokasi,
        p.tindakan_perbaikan as deskripsi
    FROM planned_task_observation p
    WHERE p.status = 'pending'
    AND p.site IN (
        SELECT site FROM users WHERE id = auth.uid()
    )
    
    UNION ALL
    
    -- Return Take 5 pending
    SELECT 
        t.id,
        'Take5'::VARCHAR(10) as sumber_laporan,
        t.nama_pelapor,
        t.tanggal,
        t.detail_lokasi,
        t.deskripsi_temuan as deskripsi
    FROM take5 t
    WHERE t.status = 'pending'
    AND t.site IN (
        SELECT site FROM users WHERE id = auth.uid()
    )
    
    ORDER BY tanggal DESC, sumber_laporan;
END;
$$ language 'plpgsql';

-- Function untuk mendapatkan detail PTO berdasarkan ID
CREATE OR REPLACE FUNCTION get_pto_details(pto_id UUID)
RETURNS TABLE (
    id UUID,
    tanggal DATE,
    site VARCHAR(50),
    detail_lokasi VARCHAR(100),
    nama_observer VARCHAR(100),
    nrp_pelapor VARCHAR(20),
    jabatan_pelapor VARCHAR(50),
    tindakan_perbaikan TEXT,
    foto_temuan TEXT,
    pic_tindak_lanjut_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.tanggal,
        p.site,
        p.detail_lokasi,
        p.nama_observer,
        p.nrp_pelapor,
        p.jabatan_pelapor,
        p.tindakan_perbaikan,
        p.foto_temuan,
        p.pic_tindak_lanjut_id
    FROM planned_task_observation p
    WHERE p.id = pto_id;
END;
$$ language 'plpgsql';

