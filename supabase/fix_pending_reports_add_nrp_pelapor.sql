-- Update get_pending_reports_for_hazard: tambah nrp_pelapor untuk tampilan unik
-- Jalankan di Supabase SQL Editor jika RPC dipakai (bukan manual query)
-- Note: Filter oleh pelapor tetap dilakukan di client (PendingReportsList.jsx)

DROP FUNCTION IF EXISTS get_pending_reports_for_hazard();

CREATE OR REPLACE FUNCTION get_pending_reports_for_hazard()
RETURNS TABLE (
    id UUID,
    sumber_laporan TEXT,
    nama_pelapor TEXT,
    nrp_pelapor TEXT,
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
    -- PTO pending
    SELECT 
        pto.id,
        'PTO'::TEXT,
        pto.nama_observer::TEXT,
        pto.nrp_pelapor::TEXT,
        pto.tanggal,
        pto.detail_lokasi::TEXT,
        pto.tindakan_perbaikan::TEXT,
        pto.site::TEXT,
        pto.pic_tindak_lanjut_id,
        pto.pic::TEXT,
        pto.foto_temuan::TEXT
    FROM planned_task_observation pto
    WHERE pto.status = 'pending'
    
    UNION ALL
    
    -- Take 5 pending (bukti_url = foto dari Take 5)
    SELECT 
        t5.id,
        'Take5'::TEXT,
        COALESCE(t5.nama, t5.pelapor_nama)::TEXT,
        COALESCE(t5.pelapor_nrp, t5.nrp)::TEXT,
        t5.tanggal,
        t5.detail_lokasi::TEXT,
        t5.deskripsi_kondisi::TEXT,
        t5.site::TEXT,
        NULL::UUID,
        NULL::TEXT,
        t5.bukti_url::TEXT
    FROM take_5 t5
    WHERE t5.status = 'pending' 
    AND t5.hazard_id IS NULL;
END;
$$ LANGUAGE plpgsql;
