-- SQL to setup Planned Task Observation (PTO) tables in Supabase
-- Run this script in your Supabase SQL Editor

-- 1. Master Data Tables (Create if not exist)

-- Master Prosedur Departemen
CREATE TABLE IF NOT EXISTS master_prosedur_departemen (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master Prosedur
CREATE TABLE IF NOT EXISTS master_prosedur (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    departemen_id UUID REFERENCES master_prosedur_departemen(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Main PTO Table
-- Dropping existing table to ensure clean state (CAUTION: Data loss)
DROP TABLE IF EXISTS planned_task_observation CASCADE;

CREATE TABLE planned_task_observation (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Info
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    site VARCHAR(50) NOT NULL,
    detail_lokasi VARCHAR(100),
    alasan_observasi VARCHAR(100) NOT NULL,
    
    -- Personnel (References to public.users)
    observer_id UUID REFERENCES users(id),
    observer_tambahan_id UUID REFERENCES users(id),
    observee_id UUID REFERENCES users(id),
    pic_tindak_lanjut_id UUID REFERENCES users(id),
    
    -- Work Details
    pekerjaan_yang_dilakukan TEXT,
    prosedur_departemen_id UUID REFERENCES master_prosedur_departemen(id),
    prosedur_id UUID REFERENCES master_prosedur(id),
    
    -- Checklist (Boolean)
    langkah_kerja_aman BOOLEAN,
    apd_sesuai BOOLEAN,
    area_kerja_aman BOOLEAN,
    peralatan_aman BOOLEAN,
    peduli_keselamatan BOOLEAN,
    paham_resiko_prosedur BOOLEAN,
    
    -- Action Items
    tindakan_perbaikan TEXT,
    foto_temuan TEXT,
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'pending', -- pending, closed
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_pto_site ON planned_task_observation(site);
CREATE INDEX IF NOT EXISTS idx_pto_tanggal ON planned_task_observation(tanggal);
CREATE INDEX IF NOT EXISTS idx_pto_observer ON planned_task_observation(observer_id);
CREATE INDEX IF NOT EXISTS idx_pto_observee ON planned_task_observation(observee_id);
CREATE INDEX IF NOT EXISTS idx_pto_created_by ON planned_task_observation(created_by);

-- 4. Row Level Security (RLS)
ALTER TABLE planned_task_observation ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to view PTOs from their site
CREATE POLICY "View PTO based on site" ON planned_task_observation
    FOR SELECT
    USING (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
        OR 
        auth.uid() IN (
            SELECT id FROM users WHERE role = 'admin' OR role = 'super_admin' -- Optional: Allow admins to see all
        )
    );

-- Policy 2: Allow users to insert PTOs (Basic check: User must be authenticated)
-- We relax the site check for insert to prevent 42501 errors if user's site metadata is out of sync,
-- but ideally you should enforce site match.
CREATE POLICY "Allow authenticated insert" ON planned_task_observation
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Policy 3: Allow users to update their own PTOs or if they are the observer/pic
CREATE POLICY "Allow update for owners" ON planned_task_observation
    FOR UPDATE
    USING (
        created_by = auth.uid() OR 
        observer_id = auth.uid() OR
        pic_tindak_lanjut_id = auth.uid()
    );

-- Policy 4: Allow delete for owners (Optional)
CREATE POLICY "Allow delete for owners" ON planned_task_observation
    FOR DELETE
    USING (created_by = auth.uid());


-- 5. Enable RLS on Master tables (Optional, usually read-only for public/authenticated)
ALTER TABLE master_prosedur_departemen ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_prosedur ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Allow read master_prosedur_departemen" ON master_prosedur_departemen
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read master_prosedur" ON master_prosedur
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert/update/delete only for admins (Adjust logic as needed)
-- ...

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_pto_updated_at ON planned_task_observation;
CREATE TRIGGER update_pto_updated_at 
    BEFORE UPDATE ON planned_task_observation 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Grant permissions (If needed, depending on default role settings)
GRANT ALL ON planned_task_observation TO authenticated;
GRANT ALL ON master_prosedur_departemen TO authenticated;
GRANT ALL ON master_prosedur TO authenticated;
