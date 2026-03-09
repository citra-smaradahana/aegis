-- =====================================================
-- COMPLETE PTO BACKEND IMPLEMENTATION
-- =====================================================
-- File ini berisi semua perubahan backend untuk PTO
-- Jalankan file ini di Supabase SQL Editor

-- =====================================================
-- 1. CREATE PTO TABLE
-- =====================================================

CREATE TABLE planned_task_observation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informasi Dasar
    tanggal DATE NOT NULL,
    site VARCHAR(50) NOT NULL,
    detail_lokasi VARCHAR(100),
    alasan_observasi VARCHAR(100) NOT NULL,
    
    -- Personel (ID references)
    observer_id UUID REFERENCES users(id),
    observer_tambahan_id UUID REFERENCES users(id),
    observee_id UUID REFERENCES users(id) NOT NULL,
    pic_tindak_lanjut_id UUID REFERENCES users(id),
    
    -- Personel (Nama & NRP - untuk kemudahan query)
    nama_observer VARCHAR(100),
    nrp_pelapor VARCHAR(20),
    jabatan_pelapor VARCHAR(50),
    nrp_observer_tambahan VARCHAR(20),
    nrp_observee VARCHAR(20),
    nrp_pic VARCHAR(20),
    
    -- Pekerjaan
    pekerjaan_yang_dilakukan TEXT,
    prosedur_id UUID, -- Akan dibuat table prosedur nanti
    
    -- Checklist Observasi (6 pertanyaan)
    langkah_kerja_aman BOOLEAN,
    apd_sesuai BOOLEAN,
    area_kerja_aman BOOLEAN,
    peralatan_aman BOOLEAN,
    peduli_keselamatan BOOLEAN,
    paham_resiko_prosedur BOOLEAN,
    
    -- Tindakan Perbaikan (jika ada jawaban tidak)
    tindakan_perbaikan TEXT,
    foto_temuan TEXT, -- URL foto dari bucket 'pto-evidence'
    
    -- Status PTO
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'closed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    CONSTRAINT check_alasan_observasi CHECK (
        alasan_observasi IN (
            'Pekerja Baru',
            'Kinerja Pekerja Kurang Baik', 
            'Tes Praktek',
            'Kinerja Pekerja Baik',
            'Observasi Rutin',
            'Baru Terjadi Insiden',
            'Pekerja Dengan Pengetahuan Terbatas'
        )
    )
);

-- =====================================================
-- 2. UPDATE HAZARD_REPORT TABLE
-- =====================================================

-- Tambah kolom untuk tracking sumber laporan ke tabel hazard_report
ALTER TABLE hazard_report 
ADD COLUMN IF NOT EXISTS sumber_laporan VARCHAR(10) CHECK (sumber_laporan IN ('Take5', 'PTO')),
ADD COLUMN IF NOT EXISTS id_sumber_laporan UUID,
ADD COLUMN IF NOT EXISTS take_5_id UUID REFERENCES take_5(id);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Index untuk PTO
CREATE INDEX idx_pto_site ON planned_task_observation(site);
CREATE INDEX idx_pto_tanggal ON planned_task_observation(tanggal);
CREATE INDEX idx_pto_observer ON planned_task_observation(observer_id);
CREATE INDEX idx_pto_observee ON planned_task_observation(observee_id);
CREATE INDEX idx_pto_created_by ON planned_task_observation(created_by);
CREATE INDEX idx_pto_status ON planned_task_observation(status);

-- Index untuk hazard_report
CREATE INDEX IF NOT EXISTS idx_hazard_sumber_laporan ON hazard_report(sumber_laporan, id_sumber_laporan);
CREATE INDEX IF NOT EXISTS idx_hazard_take5_id ON hazard_report(take_5_id);

-- =====================================================
-- 5. CREATE TRIGGERS AND FUNCTIONS
-- =====================================================

-- Trigger untuk update updated_at di PTO
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pto_updated_at 
    BEFORE UPDATE ON planned_task_observation 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger untuk auto-fill nama dan NRP di PTO saat insert/update
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update nama_observer dan nrp_pelapor dari observer_id
    IF NEW.observer_id IS NOT NULL THEN
        SELECT nama, nrp, jabatan INTO NEW.nama_observer, NEW.nrp_pelapor, NEW.jabatan_pelapor
        FROM users WHERE id = NEW.observer_id;
    END IF;
    
    -- Update nrp_observer_tambahan dari observer_tambahan_id
    IF NEW.observer_tambahan_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_observer_tambahan
        FROM users WHERE id = NEW.observer_tambahan_id;
    END IF;
    
    -- Update nrp_observee dari observee_id
    IF NEW.observee_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_observee
        FROM users WHERE id = NEW.observee_id;
    END IF;
    
    -- Update nrp_pic dari pic_tindak_lanjut_id
    IF NEW.pic_tindak_lanjut_id IS NOT NULL THEN
        SELECT nrp INTO NEW.nrp_pic
        FROM users WHERE id = NEW.pic_tindak_lanjut_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pto_user_info_trigger
    BEFORE INSERT OR UPDATE ON planned_task_observation
    FOR EACH ROW
    EXECUTE FUNCTION update_pto_user_info();

-- Function untuk membuat hazard report otomatis dari PTO
CREATE OR REPLACE FUNCTION create_hazard_report_from_pto(pto_id UUID)
RETURNS UUID AS $$
DECLARE
    hazard_id UUID;
    pto_record RECORD;
BEGIN
    -- Ambil data PTO
    SELECT * INTO pto_record FROM planned_task_observation WHERE id = pto_id;
    
    -- Buat hazard report
    INSERT INTO hazard_report (
        tanggal,
        site,
        detail_lokasi,
        kategori_hazard,
        deskripsi_hazard,
        tingkat_keparahan,
        tingkat_kemungkinan,
        tindakan_perbaikan,
        pic_tindak_lanjut_id,
        foto_temuan,
        status,
        created_by,
        sumber_laporan,
        id_sumber_laporan
    ) VALUES (
        pto_record.tanggal,
        pto_record.site,
        pto_record.detail_lokasi,
        'Observasi Pekerjaan',
        pto_record.tindakan_perbaikan,
        3, -- Default tingkat keparahan
        3, -- Default tingkat kemungkinan
        pto_record.tindakan_perbaikan,
        pto_record.pic_tindak_lanjut_id,
        pto_record.foto_temuan,
        'pending',
        pto_record.created_by,
        'PTO',
        pto_record.id
    ) RETURNING id INTO hazard_id;
    
    -- Update status PTO menjadi pending
    UPDATE planned_task_observation 
    SET status = 'pending' 
    WHERE id = pto_id;
    
    RETURN hazard_id;
END;
$$ language 'plpgsql';

-- Function untuk update status PTO menjadi closed ketika hazard report selesai
CREATE OR REPLACE FUNCTION update_pto_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika hazard report status berubah menjadi closed dan sumbernya PTO
    IF NEW.status = 'closed' AND NEW.sumber_laporan = 'PTO' AND NEW.id_sumber_laporan IS NOT NULL THEN
        -- Update status PTO menjadi closed
        UPDATE planned_task_observation 
        SET status = 'closed' 
        WHERE id = NEW.id_sumber_laporan;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk update status PTO ketika hazard report selesai
CREATE TRIGGER update_pto_status_trigger
    AFTER UPDATE ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_pto_status_from_hazard();

-- Function untuk update hazard_id di take_5 ketika hazard report dibuat dari Take 5
CREATE OR REPLACE FUNCTION update_take5_hazard_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika hazard report baru dibuat dan ada take_5_id
    IF NEW.take_5_id IS NOT NULL THEN
        -- Update take_5 dengan hazard_id (UUID dari hazard_report.id)
        UPDATE take_5 
        SET hazard_id = NEW.id
        WHERE id = NEW.take_5_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk update take_5.hazard_id ketika hazard report dibuat
CREATE TRIGGER update_take5_hazard_id_trigger
    AFTER INSERT ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_take5_hazard_id();

-- Function untuk update status take5 menjadi closed ketika hazard report selesai
-- Menggunakan hazard_id yang sudah ada di tabel take_5
CREATE OR REPLACE FUNCTION update_take5_status_from_hazard()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika hazard report status berubah menjadi closed
    IF NEW.status = 'closed' THEN
        -- Update status take5 menjadi closed berdasarkan hazard_id
        UPDATE take_5 
        SET status = 'closed' 
        WHERE hazard_id::text = NEW.id::text;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk update status take5 ketika hazard report selesai
CREATE TRIGGER update_take5_status_trigger
    AFTER UPDATE ON hazard_report
    FOR EACH ROW
    EXECUTE FUNCTION update_take5_status_from_hazard();

-- =====================================================
-- 6. UTILITY FUNCTIONS
-- =====================================================

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
        COALESCE(p.tindakan_perbaikan, 'Tidak ada deskripsi') as deskripsi
    FROM planned_task_observation p
    WHERE p.status = 'pending'
    
    UNION ALL
    
    -- Return Take 5 pending (menggunakan struktur tabel yang benar)
    SELECT 
        t.id,
        'Take5'::VARCHAR(10) as sumber_laporan,
        COALESCE(t.nama, t.pelapor_nama) as nama_pelapor,
        t.tanggal,
        t.detail_lokasi,
        COALESCE(t.deskripsi_kondisi, 'Tidak ada deskripsi') as deskripsi
    FROM take_5 t
    WHERE t.status = 'pending'
    AND t.hazard_id IS NULL  -- Hanya yang belum dibuat hazard report
    
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

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS untuk PTO
ALTER TABLE planned_task_observation ENABLE ROW LEVEL SECURITY;

-- Policy untuk user hanya bisa melihat data dari site mereka
CREATE POLICY pto_site_policy ON planned_task_observation
    FOR ALL
    USING (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    );

-- =====================================================
-- 8. UPDATE EXISTING DATA (jika diperlukan)
-- =====================================================

-- Update existing Take 5 hazard reports untuk set sumber_laporan = 'Take5'
-- Berdasarkan hazard_id yang sudah ada di tabel take_5
UPDATE hazard_report 
SET sumber_laporan = 'Take5',
    take_5_id = (
        SELECT t.id 
        FROM take_5 t 
        WHERE t.hazard_id::text = hazard_report.id::text
        LIMIT 1
    )
WHERE sumber_laporan IS NULL 
AND EXISTS (
    SELECT 1 FROM take_5 t 
    WHERE t.hazard_id::text = hazard_report.id::text
);

-- =====================================================
-- COMPLETE PTO BACKEND IMPLEMENTATION FINISHED
-- =====================================================
-- 
-- Langkah selanjutnya:
-- 1. Jalankan file ini di Supabase SQL Editor
-- 2. Update frontend PTO form untuk menggunakan backend baru
-- 3. Update form hazard report untuk menampilkan dropdown PTO pending
-- 4. Test seluruh workflow PTO -> Hazard Report
