-- SQL untuk table Planned Task Observation (PTO)
CREATE TABLE planned_task_observation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informasi Dasar
    tanggal DATE NOT NULL,
    site VARCHAR(50) NOT NULL,
    detail_lokasi VARCHAR(100),
    alasan_observasi VARCHAR(100) NOT NULL,
    
    -- Personel
    observer_id UUID REFERENCES users(id),
    observer_tambahan_id UUID REFERENCES users(id),
    observee_id UUID REFERENCES users(id) NOT NULL,
    
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
     pic_tindak_lanjut_id UUID REFERENCES users(id),
     foto_temuan TEXT, -- URL foto dari bucket 'pto-evidence'
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'active',
    
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
