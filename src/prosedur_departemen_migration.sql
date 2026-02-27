-- Migration untuk Prosedur Departemen
-- 1. Create table master_prosedur_departemen
CREATE TABLE IF NOT EXISTS master_prosedur_departemen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add RLS
ALTER TABLE master_prosedur_departemen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all master_prosedur_departemen" ON master_prosedur_departemen;
CREATE POLICY "Allow all master_prosedur_departemen" ON master_prosedur_departemen FOR ALL USING (true) WITH CHECK (true);

-- 3. Add column departemen_id to master_prosedur
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'master_prosedur' 
        AND column_name = 'departemen_id'
    ) THEN
        ALTER TABLE master_prosedur 
        ADD COLUMN departemen_id UUID REFERENCES master_prosedur_departemen(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Seed default data for Departemen (Example: Mining, Plant, Safety, etc.)
-- You can add more based on user requirements or leave it for them to input
INSERT INTO master_prosedur_departemen (name, sort_order) VALUES
  ('Mining', 1),
  ('Plant', 2),
  ('SHE', 3),
  ('HRGA', 4),
  ('Logistics', 5),
  ('Engineering', 6)
ON CONFLICT (name) DO NOTHING;

-- 5. Update existing procedures to link to a default department if needed
-- For now we leave them null, user can update them in Admin Settings
