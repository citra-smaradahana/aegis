-- =====================================================
-- FIX TYPE MISMATCH ERROR IN get_pending_reports_for_hazard
-- =====================================================
-- Jalankan file ini di Supabase SQL Editor

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_pending_reports_for_hazard();

-- Create new function with explicit type casting
CREATE OR REPLACE FUNCTION get_pending_reports_for_hazard()
RETURNS TABLE (
    id UUID,
    sumber_laporan TEXT,
    nama_pelapor TEXT,
    tanggal DATE,
    detail_lokasi TEXT,
    deskripsi TEXT,
    site TEXT,
    pic_tindak_lanjut_id UUID,
    nrp_pic TEXT,
    foto_temuan TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- PTO pending reports
    SELECT 
        pto.id AS id,
        'PTO'::TEXT AS sumber_laporan,
        pto.nama_observer::TEXT AS nama_pelapor,  -- Explicit cast to TEXT
        pto.tanggal AS tanggal,
        pto.detail_lokasi::TEXT AS detail_lokasi,  -- Explicit cast to TEXT
        pto.tindakan_perbaikan::TEXT AS deskripsi,  -- Explicit cast to TEXT
        pto.site::TEXT AS site,  -- Explicit cast to TEXT
        pto.pic_tindak_lanjut_id AS pic_tindak_lanjut_id,
        pto.pic::TEXT AS nrp_pic,  -- Explicit cast to TEXT
        pto.foto_temuan::TEXT AS foto_temuan  -- Include foto temuan
    FROM planned_task_observation pto
    WHERE pto.status = 'pending'
    
    UNION ALL
    
    -- Take 5 pending reports
    SELECT 
        t5.id AS id,
        'Take5'::TEXT AS sumber_laporan,
        COALESCE(t5.nama, t5.pelapor_nama)::TEXT AS nama_pelapor,  -- Explicit cast to TEXT
        t5.tanggal AS tanggal,
        t5.detail_lokasi::TEXT AS detail_lokasi,  -- Explicit cast to TEXT
        t5.deskripsi_kondisi::TEXT AS deskripsi,  -- Explicit cast to TEXT
        NULL::TEXT AS site,
        NULL::UUID AS pic_tindak_lanjut_id,
        NULL::TEXT AS nrp_pic,
        NULL::TEXT AS foto_temuan
    FROM take_5 t5
    WHERE t5.status = 'pending' 
    AND t5.hazard_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_pending_reports_for_hazard();
