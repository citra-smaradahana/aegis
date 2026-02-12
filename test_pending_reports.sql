-- Test query untuk melihat struktur tabel
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'planned_task_observation' 
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'take_5' 
ORDER BY ordinal_position;

-- Function yang lebih sederhana untuk test
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
        COALESCE(p.nama_observer, 'Unknown') as nama_pelapor,
        p.tanggal,
        COALESCE(p.detail_lokasi, 'Unknown') as detail_lokasi,
        COALESCE(p.tindakan_perbaikan, 'Tidak ada deskripsi') as deskripsi
    FROM planned_task_observation p
    WHERE p.status = 'pending';
    
    -- Return Take 5 pending
    RETURN QUERY
    SELECT 
        t.id,
        'Take5'::VARCHAR(10) as sumber_laporan,
        COALESCE(t.nama, t.pelapor_nama, 'Unknown') as nama_pelapor,
        t.tanggal,
        COALESCE(t.detail_lokasi, 'Unknown') as detail_lokasi,
        COALESCE(t.deskripsi_kondisi, 'Tidak ada deskripsi') as deskripsi
    FROM take_5 t
    WHERE t.status = 'pending'
    AND t.hazard_id IS NULL;
END;
$$ language 'plpgsql';
