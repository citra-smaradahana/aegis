-- SQL untuk table Planned Task Observation (PTO) - Updated Version
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

-- Index untuk performa query
CREATE INDEX idx_pto_site ON planned_task_observation(site);
CREATE INDEX idx_pto_tanggal ON planned_task_observation(tanggal);
CREATE INDEX idx_pto_observer ON planned_task_observation(observer_id);
CREATE INDEX idx_pto_observee ON planned_task_observation(observee_id);
CREATE INDEX idx_pto_created_by ON planned_task_observation(created_by);
CREATE INDEX idx_pto_status ON planned_task_observation(status);

-- Trigger untuk update updated_at
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

-- Trigger untuk auto-fill nama dan NRP saat insert/update
CREATE OR REPLACE FUNCTION update_pto_user_info()
RETURNS TRIGGER AS $$
BEGIN
    -- Update nama_observer dan nrp_pelapor dari observer_id
    IF NEW.observer_id IS NOT NULL THEN
        SELECT name, nrp, jabatan INTO NEW.nama_observer, NEW.nrp_pelapor, NEW.jabatan_pelapor
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

-- Row Level Security (RLS) - jika diperlukan
ALTER TABLE planned_task_observation ENABLE ROW LEVEL SECURITY;

-- Policy untuk user hanya bisa melihat data dari site mereka
CREATE POLICY pto_site_policy ON planned_task_observation
    FOR ALL
    USING (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    );

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

