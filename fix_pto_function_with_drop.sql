-- =====================================================
-- FIX PTO FUNCTION WITH PIC FIELD - DROP FIRST
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- 1. Drop function lama terlebih dahulu
DROP FUNCTION IF EXISTS get_pending_reports_for_hazard();

-- 2. Buat function baru dengan field nrp_pic
CREATE OR REPLACE FUNCTION get_pending_reports_for_hazard()
RETURNS TABLE (
    id UUID,
    sumber_laporan VARCHAR(10),
    nama_pelapor VARCHAR(100),
    tanggal DATE,
    detail_lokasi VARCHAR(100),
    deskripsi TEXT,
    site VARCHAR(100),
    nrp_pic VARCHAR(100)
) AS $$
BEGIN
    -- Return PTO pending with PIC
    RETURN QUERY
    SELECT 
        p.id,
        'PTO'::VARCHAR(10) as sumber_laporan,
        p.nama_observer as nama_pelapor,
        p.tanggal,
        p.detail_lokasi,
        COALESCE(p.tindakan_perbaikan, 'Tidak ada deskripsi') as deskripsi,
        p.site,
        COALESCE(p.pic, p.nrp_pic, u.nama, '') as nrp_pic
    FROM planned_task_observation p
    LEFT JOIN users u ON p.pic_tindak_lanjut_id = u.id
    WHERE p.status = 'pending'
    
    UNION ALL
    
    -- Return Take 5 pending
    SELECT 
        t.id,
        'Take5'::VARCHAR(10) as sumber_laporan,
        COALESCE(t.nama, t.pelapor_nama) as nama_pelapor,
        t.tanggal,
        t.detail_lokasi,
        COALESCE(t.deskripsi_kondisi, 'Tidak ada deskripsi') as deskripsi,
        t.site,
        ''::VARCHAR(100) as nrp_pic
    FROM take_5 t
    WHERE t.status = 'pending'
    AND t.hazard_id IS NULL
    
    ORDER BY tanggal DESC, sumber_laporan;
END;
$$ language 'plpgsql';


