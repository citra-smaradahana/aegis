-- Fix RLS policy untuk planned_task_observation
-- Drop existing policy
DROP POLICY IF EXISTS pto_site_policy ON planned_task_observation;

-- Create new policy yang mengizinkan INSERT dan SELECT
CREATE POLICY pto_insert_policy ON planned_task_observation
    FOR INSERT
    WITH CHECK (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY pto_select_policy ON planned_task_observation
    FOR SELECT
    USING (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY pto_update_policy ON planned_task_observation
    FOR UPDATE
    USING (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        site IN (
            SELECT site FROM users WHERE id = auth.uid()
        )
    );

-- Alternative: Jika masih bermasalah, bisa disable RLS sementara untuk testing
-- ALTER TABLE planned_task_observation DISABLE ROW LEVEL SECURITY;
