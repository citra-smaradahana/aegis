-- SQL to alter planned_task_observation table and add prosedur_departemen_id column
-- This ensures the "Pilih Prosedur Departemen" selection is saved to the database

BEGIN;

-- 1. Add the new column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'planned_task_observation'
        AND column_name = 'prosedur_departemen_id'
    ) THEN
        ALTER TABLE planned_task_observation
        ADD COLUMN prosedur_departemen_id UUID REFERENCES master_prosedur_departemen(id);
    END IF;
END $$;

-- 2. Update the RLS policies to include the new column (if necessary, though standard INSERT policies usually handle all columns)
-- Just ensuring the policies are still valid. No specific action needed for standard INSERT unless column-specific policies exist.

COMMIT;
